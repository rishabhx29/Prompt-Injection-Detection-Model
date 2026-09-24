/**
 * Minimal Gemini REST client with function calling — no SDK, just `fetch`.
 *
 * Uses the classic `v1beta/models/{model}:generateContent` endpoint (stable REST
 * shape): each turn sends the whole conversation `contents` array; when the model
 * wants a tool it returns `functionCall` parts, and the loop appends a
 * `functionResponse` part for each call before asking again.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/function-calling
 */

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiToolSchema {
  type: "object" | "string" | "number" | "integer" | "boolean" | "array";
  description?: string;
  properties?: Record<string, GeminiToolSchema>;
  required?: string[];
  items?: GeminiToolSchema;
  enum?: string[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: GeminiToolSchema;
}

export interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

export type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiToolConfig {
  functionCallingConfig?: { mode: "AUTO" | "ANY" | "NONE" };
}

export interface GeminiGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  toolConfig?: GeminiToolConfig;
}

export class GeminiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface GenerateOptions {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  contents: GeminiContent[];
  tools?: GeminiTool[];
  generationConfig?: GeminiGenerationConfig;
  /** Fetch seam for tests. */
  fetchImpl?: typeof fetch;
}

export interface GeminiGenerateResult {
  text: string;
  functionCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }>;
  /**
   * The model turn's raw parts, verbatim. Gemini 3 attaches `thoughtSignature`
   * (and call `id`s) to function-call parts that MUST be echoed back on the next
   * request, so the agent loop replays these instead of rebuilding them.
   */
  modelParts: GeminiPart[];
  raw: unknown;
  usage: { inputTokens: number; outputTokens: number };
}

interface CandidatePart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  thoughtSignature?: string;
}

/** Retry these status codes with backoff (free-tier throttling and load spikes). */
const RETRY_STATUS = new Set([429, 500, 503, 504]);
const RETRY_DELAYS_MS = [800, 2000, 5000, 10000];

/** Parse the server's preferred wait (Retry-After header or `retryDelay` in the error body). */
function retryDelayMs(response: Response, detail: string): number | undefined {
  const header = response.headers.get("retry-after");
  if (header !== null) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }
  const match = /"retryDelay":\s*"(\d+)s"/u.exec(detail);
  if (match !== null) {
    const seconds = Number(match[1]);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }
  return undefined;
}

/** Fallback models tried in order when the primary model's quota is exhausted (429).
 *  The `-latest` aliases never retire and always resolve to a current model. */
export const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-2.5-flash"];

/**
 * One `generateContent` round-trip, with backoff on transient failures.
 *
 * Returns the model text and any function calls it requested. Function calls
 * must be answered with `functionResponse` parts in the next `contents` entry —
 * that loop lives in `agent.ts`, not here.
 */
export async function generate(options: GenerateOptions): Promise<GeminiGenerateResult> {
  // Try the primary model, then the fallback list, so an exhausted per-model
  // free-tier quota degrades to another model instead of failing the episode.
  const primary = options.model ?? "gemini-flash-latest";
  const models = [primary, ...FALLBACK_MODELS.filter((candidate) => candidate !== primary)];

  let lastError: unknown;
  const tried: string[] = [];
  for (const model of models) {
    tried.push(model);
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        return await generateOnce({ ...options, model });
      } catch (error) {
        lastError = error;
        const retryable = error instanceof GeminiError && RETRY_STATUS.has(error.status);
        if (!retryable) throw error;
        // Quota exhausted for THIS model: move to the next one immediately.
        if (error instanceof GeminiError && error.status === 429) break;
        if (attempt === RETRY_DELAYS_MS.length) break;
        const withDelay = error as GeminiError & { retryAfterMs?: number };
        const delay = Math.min(withDelay.retryAfterMs ?? RETRY_DELAYS_MS[attempt] ?? 5000, 65_000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  const summary =
    lastError instanceof GeminiError
      ? `${lastError.message} [tried models: ${tried.join(", ")}]`
      : String(lastError);
  throw new GeminiError(summary, lastError instanceof GeminiError ? lastError.status : 500);
}

async function generateOnce(options: GenerateOptions): Promise<GeminiGenerateResult> {
  const {
    apiKey,
    model = "gemini-flash-latest",
    systemInstruction,
    contents,
    tools,
    generationConfig,
    fetchImpl = fetch,
  } = options;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: generationConfig?.temperature ?? 0.2,
      maxOutputTokens: generationConfig?.maxOutputTokens ?? 2048,
      ...(generationConfig?.toolConfig === undefined ? {} : { toolConfig: generationConfig.toolConfig }),
    },
  };
  if (systemInstruction !== undefined) body.systemInstruction = { parts: [{ text: systemInstruction }] };
  if (tools !== undefined) body.tools = tools;

  const response = await fetchImpl(`${API_ROOT}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new GeminiError(
      `Gemini API error ${response.status} (${model}): ${detail.slice(0, 400)}`,
      response.status,
    );
    // Surface the server's preferred wait so callers can back off properly.
    const delay = retryDelayMs(response, detail);
    if (delay !== undefined) (error as GeminiError & { retryAfterMs?: number }).retryAfterMs = delay;
    throw error;
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: CandidatePart[] }; finishReason?: string }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };

  const candidate = payload.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  let text = "";
  const functionCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }> = [];
  for (const part of parts) {
    if (typeof part.text === "string") text += part.text;
    if (part.functionCall !== undefined) {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args ?? {},
        ...(part.functionCall.id === undefined ? {} : { id: part.functionCall.id }),
      });
    }
  }

  return {
    text,
    functionCalls,
    modelParts: parts as GeminiPart[],
    raw: payload,
    usage: {
      inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}
