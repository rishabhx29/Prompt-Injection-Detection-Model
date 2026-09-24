/**
 * Agent-demo view extractor.
 *
 * A browser-based LLM agent does not "see a page" — it reads the DOM, the
 * accessibility tree, and sometimes the raw markup. This module turns one fetched
 * HTML document into exactly those observation channels, in the shape the frozen
 * contract expects (`docs/03_API_CONTRACT.md` §3.1, `fixtures/CONTRACT.md` §2.2):
 *
 * | Channel read here          | Request field       | `view` emitted        |
 * |---|---|---|
 * | rendered text              | `visibleText`       | `visible_text`        |
 * | every DOM text node        | `domText`           | `dom`                 |
 * | visually hidden, comments  | `hiddenText`        | `hidden_dom`          |
 * | aria-label, describedby, alt, sr-only | `accessibilityText` | `accessibility_tree` |
 *
 * **This module does no detection, scoring, or policy.** It is a reader, not a
 * guard: every verdict comes from `ctxvigil` (`packages/ctxvigil-core`). Keeping the
 * reader dumb is what keeps the demo honest — the extractor cannot "help" the
 * detector find anything.
 *
 * Concealment rules, decided once and applied literally:
 *
 * - `hidden`, `display:none`, `visibility:hidden` → not rendered *and* not in the
 *   accessibility tree → `hiddenText` (the `hidden_dom` view).
 * - `.sr-only` / `.visually-hidden` text → not rendered but reachable by a screen
 *   reader → `accessibilityText` with `kind: "hidden_span"`. This is the case that
 *   makes the ARIA attack visible to the layer.
 * - HTML comments → `hiddenText` (comment cloaking).
 * - `aria-hidden="true"` → rendered for a sighted reader but absent from the
 *   accessibility tree → `domText` only, because an agent reading the AX tree would
 *   miss it while a human would not. Reporting it as "hidden" would overstate.
 */

/* -------------------------------------------------------------------------- */
/* Contract-shaped output                                                     */
/* -------------------------------------------------------------------------- */

export type AccessibilityKind = "aria-label" | "alt" | "role_description" | "hidden_span";

export interface AccessibilityEntry {
  text: string;
  kind: AccessibilityKind;
  selector?: string;
}

/** The `page` object of a `ScanPageRequest`, plus the URL it was fetched from. */
export interface PageViews {
  url: string;
  title: string;
  visibleText: string[];
  domText: string[];
  hiddenText: string[];
  accessibilityText: AccessibilityEntry[];
  /** OCR is a Phase 7 extra and stays empty in v1 (contract §3.1). */
  imageText: string[];
}

/** The scripted agent's proposed next step, declared by the fixture page. */
export interface AgentPlan {
  type: string;
  label: string;
  riskCategory: string;
}

/**
 * Fixture metadata read from `<meta name="ctxvigil:...">` tags.
 *
 * The *page* declares the episode (task, plan, and the verdict the demo asserts)
 * instead of the runner, so the runner stays generic and the demo is
 * self-verifying: a scenario whose engine verdict stops matching its page banner
 * fails loudly rather than quietly.
 */
export interface PageExpectation {
  scenarioId?: string;
  scenarioTitle?: string;
  scanId?: string;
  userTask?: string;
  expectedDecision?: string;
  expectedRiskLevel?: string;
  systemPrompt?: string;
  agentPlan?: AgentPlan;
}

export interface ExtractionDiagnostics {
  /** Elements visited. */
  elements: number;
  /** Comments treated as concealed content. */
  comments: number;
  /** Text chunks dropped as empty after whitespace normalisation. */
  emptyDropped: number;
}

export interface ExtractionResult {
  views: PageViews;
  expectation: PageExpectation;
  diagnostics: ExtractionDiagnostics;
}

/* -------------------------------------------------------------------------- */
/* Tag classification                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Elements that end a text run. Their accumulated text flushes as one chunk, so
 * `<li>Refunds are <strong>free</strong> within 30 days</li>` reads as a single
 * sentence rather than three fragments.
 */
const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "button", "caption", "dd",
  "details", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "label", "legend", "li", "main",
  "nav", "option", "p", "pre", "section", "summary", "td", "textarea", "th",
  "title", "tr",
]);

/** Elements that never flush on their own; their text joins the enclosing block. */
const INLINE_TAGS = new Set([
  "a", "abbr", "b", "bdi", "cite", "code", "data", "del", "dfn", "em", "i",
  "ins", "kbd", "mark", "q", "ruby", "s", "samp", "small", "span", "strong",
  "sub", "sup", "time", "u", "var", "wbr",
]);

/** Elements with no closing tag. */
const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr",
]);

/** Elements whose contents are markup, never page content. */
const SKIPPED_TAGS = new Set([
  "audio", "canvas", "head", "iframe", "math", "noscript", "object", "script",
  "style", "svg", "template", "video",
]);

/** Classes that hide content from sighted users while keeping it in the AX tree. */
const SR_ONLY_CLASSES = ["sr-only", "visually-hidden", "screen-reader-only", "visuallyhidden"];

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

const ENTITIES: Record<string, string> = {
  amp: "&", apos: "'", gt: ">", hellip: "…", lt: "<", nbsp: " ", quot: '"',
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", mdash: "—", ndash: "–",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Collapse whitespace runs and trim — mirrors core normalisation (FR-2.3). */
function tidy(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function pushUnique(list: string[], value: string): void {
  if (value !== "" && !list.includes(value)) list.push(value);
}

/** Parse an element's attributes into a lowercase-keyed map (bare attrs → ""). */
function parseAttributes(raw: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null = pattern.exec(raw);
  while (match !== null) {
    const name = (match[1] ?? "").toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name !== "" && !attributes.has(name)) attributes.set(name, value);
    match = pattern.exec(raw);
  }
  return attributes;
}

/** A stable, human-checkable selector for an element. */
function selectorFor(
  tag: string,
  attributes: Map<string, string>,
  siblings: Map<string, number>,
): string {
  const id = (attributes.get("id") ?? "").trim();
  if (id !== "") return `#${id}`;

  const classes = (attributes.get("class") ?? "").trim().split(/\s+/).filter(Boolean);
  const base = classes.length > 0 ? `${tag}.${classes[0]}` : tag;
  const seen = (siblings.get(base) ?? 0) + 1;
  siblings.set(base, seen);
  return seen === 1 ? base : `${base}:nth-of-type(${seen})`;
}

interface Concealment {
  /** Rendered for a sighted reader. */
  rendered: boolean;
  /** Reachable in the accessibility tree. */
  accessible: boolean;
}

function concealmentFor(_tag: string, attributes: Map<string, string>): Concealment {
  const style = (attributes.get("style") ?? "").replace(/\s+/gu, "").toLowerCase();
  const classes = (attributes.get("class") ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const srOnly = classes.some((name) => SR_ONLY_CLASSES.includes(name));

  const visuallyHidden =
    srOnly ||
    attributes.has("hidden") ||
    style.includes("display:none") ||
    style.includes("visibility:hidden");
  const ariaHidden = (attributes.get("aria-hidden") ?? "").trim().toLowerCase() === "true";

  // Screen-reader-only text is unreachable by eye but *is* present in the
  // accessibility tree — precisely why it is the ARIA attack's channel of choice.
  // Content hidden with `display:none` or `hidden` is in neither tree.
  return {
    rendered: !visuallyHidden,
    accessible: !ariaHidden && (srOnly || !visuallyHidden),
  };
}

/* -------------------------------------------------------------------------- */
/* Page metadata and declared expectation                                     */
/* -------------------------------------------------------------------------- */

function readMeta(html: string): Map<string, string> {
  const meta = new Map<string, string>();
  const pattern = /<meta\s+([^>]*?)\/?>/gi;
  let match: RegExpExecArray | null = pattern.exec(html);
  while (match !== null) {
    const attributes = parseAttributes(match[1] ?? "");
    const name = (attributes.get("name") ?? attributes.get("property") ?? "").trim().toLowerCase();
    const content = attributes.get("content") ?? "";
    if (name !== "" && content !== "") meta.set(name, decodeEntities(content));
    match = pattern.exec(html);
  }
  return meta;
}

function readTitle(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match === null ? "" : tidy(decodeEntities(match[1] ?? ""));
}

/**
 * Read the page's declared expectation (`ctxvigil:*` meta tags) and agent plan.
 *
 * Exported because the runner needs the plan and the asserted verdict without
 * re-walking the document.
 */
export function readExpectation(html: string): PageExpectation {
  const meta = readMeta(html);
  const expectation: PageExpectation = {};
  const assign = (key: string, name: keyof PageExpectation): void => {
    const value = meta.get(key);
    if (value !== undefined && value.trim() !== "") {
      expectation[name] = value.trim() as never;
    }
  };

  assign("ctxvigil:scenario-id", "scenarioId");
  assign("ctxvigil:scenario-title", "scenarioTitle");
  assign("ctxvigil:scan-id", "scanId");
  assign("ctxvigil:user-task", "userTask");
  assign("ctxvigil:expected-decision", "expectedDecision");
  assign("ctxvigil:expected-risk-level", "expectedRiskLevel");
  assign("ctxvigil:system-prompt", "systemPrompt");

  const plan = meta.get("ctxvigil:agent-plan");
  if (plan !== undefined) {
    try {
      const parsed = JSON.parse(plan) as Partial<AgentPlan>;
      if (
        typeof parsed.type === "string" &&
        typeof parsed.label === "string" &&
        typeof parsed.riskCategory === "string"
      ) {
        expectation.agentPlan = {
          type: parsed.type,
          label: parsed.label,
          riskCategory: parsed.riskCategory,
        };
      }
    } catch {
      // A malformed plan is a fixture bug; the runner reports "no plan declared".
    }
  }

  return expectation;
}

/* -------------------------------------------------------------------------- */
/* The DOM walk                                                               */
/* -------------------------------------------------------------------------- */

interface TextChunk {
  text: string;
  rendered: boolean;
  accessible: boolean;
  selector: string;
  /** Character offset in the document, so entries stay in document order. */
  order: number;
}

/** An accessibility entry plus its document position (stripped before returning). */
interface OrderedAccessibilityEntry extends AccessibilityEntry {
  order: number;
}

interface OpenElement {
  tag: string;
  skip: boolean;
  rendered: boolean;
  accessible: boolean;
  id?: string;
  selector: string;
  /** Direct text of this element plus un-flushed inline descendants. */
  buffer: TextChunk[];
}

interface Buckets {
  visibleText: string[];
  domText: string[];
  hiddenText: string[];
  accessibilityText: OrderedAccessibilityEntry[];
  comments: number;
  emptyDropped: number;
  elements: number;
}

const TOKEN_SOURCE =
  /<!--([\s\S]*?)-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;


/**
 * Flush one closed element's text into the page buckets.
 *
 * Adjacent chunks sharing provenance (same element, same concealment) are merged,
 * so a sentence interrupted by an inline tag is reported once. Concealed text
 * always joins the `dom` view — the DOM really does contain it — while only
 * screen-reader-reachable text joins the accessibility tree.
 */
function flushElement(
  element: OpenElement,
  buckets: Buckets,
  idText: Map<string, string>,
): void {
  const merged: TextChunk[] = [];
  for (const chunk of element.buffer) {
    const previous = merged[merged.length - 1];
    if (
      previous !== undefined &&
      previous.rendered === chunk.rendered &&
      previous.accessible === chunk.accessible &&
      previous.selector === chunk.selector
    ) {
      previous.text = tidy(`${previous.text} ${chunk.text}`);
      previous.order = Math.min(previous.order, chunk.order);
    } else {
      merged.push({ ...chunk });
    }
  }
  element.buffer = [];

  for (const chunk of merged) {
    const text = tidy(chunk.text);
    if (text === "") {
      buckets.emptyDropped += 1;
      continue;
    }

    if (element.id !== undefined && element.id !== "") {
      idText.set(element.id, tidy(`${idText.get(element.id) ?? ""} ${text}`));
    }

    if (!chunk.rendered) {
      pushUnique(buckets.domText, text);
      if (chunk.accessible) {
        buckets.accessibilityText.push({
          text,
          kind: "hidden_span",
          selector: chunk.selector,
          order: chunk.order,
        });
      } else {
        pushUnique(buckets.hiddenText, text);
      }
      continue;
    }

    pushUnique(buckets.visibleText, text);
    pushUnique(buckets.domText, text);
  }
}



/**
 * Extract the four contract views from one HTML document.
 *
 * Deterministic, dependency-free, and order-preserving: the same markup always
 * yields the same arrays, in document order (so scans are reproducible, NFR-1).
 */
export function extractPageViews(rawHtml: string, url: string): ExtractionResult {
  // Markup declarations (`<!doctype html>`, processing instructions) are never page
  // content an agent could read, so they are dropped before the walk. Comments are
  // kept deliberately: an agent that re-serialises the DOM *can* read those.
  const html = rawHtml.replace(/<!(?!-)[^>]*>/g, "").replace(/<\?[^>]*\?>/g, "");
  const expectation = readExpectation(html);
  const buckets: Buckets = {
    visibleText: [],
    domText: [],
    hiddenText: [],
    accessibilityText: [],
    comments: 0,
    emptyDropped: 0,
    elements: 0,
  };

  const idText = new Map<string, string>();
  const siblings = new Map<string, number>();
  const describedBy: Array<{ ref: string; selector: string; order: number }> = [];
  const stack: OpenElement[] = [];
  let rootBuffer: TextChunk[] = [];
  let cursor = 0;

  const appendText = (raw: string, order: number): void => {
    if (raw === "") return;
    if (stack.some((element) => element.skip)) return;
    let target: OpenElement | undefined;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      const element = stack[index];
      if (element !== undefined && BLOCK_TAGS.has(element.tag)) {
        target = element;
        break;
      }
    }
    const innermost = stack[stack.length - 1];
    const concealed = !stack.every((element) => element.rendered);
    const chunk: TextChunk = {
      text: raw,
      order,
      rendered: !concealed,
      accessible: stack.every((element) => element.accessible),
      // Concealed text is reported at the element that hid it (the interesting
      // fact). Ordinary text is reported at the block that will flush it, so an
      // inline tag cannot split one sentence into three findings.
      selector:
        concealed || target === undefined
          ? innermost?.selector ?? "body"
          : target.selector,
    };
    if (target === undefined) rootBuffer.push(chunk);
    else target.buffer.push(chunk);
  };

  const pattern = new RegExp(TOKEN_SOURCE.source, "g");
  let match: RegExpExecArray | null = pattern.exec(html);
  while (match !== null) {
    if (match.index > cursor) appendText(decodeEntities(html.slice(cursor, match.index)), cursor);
    cursor = pattern.lastIndex;

    const raw = match[0];
    const comment = match[1];
    const tagName = match[2];
    const attributesRaw = match[3] ?? "";
    const selfClosing = match[4] ?? "";

    if (comment !== undefined) {
      // Comment cloaking: an agent that re-serialises the DOM can read this.
      const text = tidy(decodeEntities(comment));
      if (text !== "") {
        buckets.comments += 1;
        pushUnique(buckets.domText, text);
        pushUnique(buckets.hiddenText, text);
      }
      match = pattern.exec(html);
      continue;
    }

    const tag = (tagName ?? "").toLowerCase();
    const attributes = parseAttributes(attributesRaw);
    const selector = selectorFor(tag, attributes, siblings);

    if (raw.startsWith("</")) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        const element = stack[index];
        if (element === undefined) continue;
        stack.splice(index, 1);
        if (!element.skip && BLOCK_TAGS.has(element.tag)) {
          flushElement(element, buckets, idText);
        }
        if (element.tag === tag) break;
      }
      match = pattern.exec(html);
      continue;
    }

    buckets.elements += 1;
    const concealment = concealmentFor(tag, attributes);

    // Accessibility attributes are read here, where the selector is exact.
    const ariaLabel = tidy(decodeEntities(attributes.get("aria-label") ?? ""));
    if (ariaLabel !== "") {
      buckets.accessibilityText.push({
        text: ariaLabel,
        kind: "aria-label",
        selector,
        order: match.index,
      });
    }
    const alt = tidy(decodeEntities(attributes.get("alt") ?? ""));
    if (alt !== "") {
      buckets.accessibilityText.push({ text: alt, kind: "alt", selector, order: match.index });
    }
    const describedByAttr = (attributes.get("aria-describedby") ?? "").trim();
    if (describedByAttr !== "") {
      describedBy.push({
        ref: describedByAttr.split(/\s+/u)[0] ?? "",
        selector,
        order: match.index,
      });
    }

    const skip = SKIPPED_TAGS.has(tag) || stack.some((element) => element.skip);
    const isVoid = VOID_TAGS.has(tag) || selfClosing === "/";
    if (!isVoid) {
      const id = attributes.get("id");
      stack.push({
        tag,
        skip,
        rendered: concealment.rendered,
        accessible: concealment.accessible,
        ...(id !== undefined ? { id: id.trim() } : {}),
        selector,
        buffer: [],
      });
    }

    match = pattern.exec(html);
  }

  if (cursor < html.length) appendText(decodeEntities(html.slice(cursor)), cursor);

  // Elements left open at EOF still contribute their text.
  while (stack.length > 0) {
    const element = stack.pop();
    if (element !== undefined && !element.skip && BLOCK_TAGS.has(element.tag)) {
      flushElement(element, buckets, idText);
    }
  }
  if (rootBuffer.length > 0) {
    const synthetic: OpenElement = {
      tag: "body",
      skip: false,
      rendered: true,
      accessible: true,
      selector: "body",
      buffer: rootBuffer,
    };
    rootBuffer = [];
    flushElement(synthetic, buckets, idText);
  }

  // `aria-describedby` resolves to the text of the element it points at.
  for (const reference of describedBy) {
    const text = tidy(idText.get(reference.ref) ?? "");
    if (text === "") continue;
    buckets.accessibilityText.push({
      text,
      kind: "role_description",
      selector: reference.selector,
      order: reference.order,
    });
  }

  const dedupedAccessibility: AccessibilityEntry[] = [];
  const seenAccessibility = new Set<string>();
  for (const entry of [...buckets.accessibilityText].sort((a, b) => a.order - b.order)) {
    const key = `${entry.kind}|${entry.text}|${entry.selector ?? ""}`;
    if (seenAccessibility.has(key)) continue;
    seenAccessibility.add(key);
    dedupedAccessibility.push({
      text: entry.text,
      kind: entry.kind,
      ...(entry.selector === undefined ? {} : { selector: entry.selector }),
    });
  }

  return {
    views: {
      url,
      title: readTitle(html),
      visibleText: buckets.visibleText,
      domText: buckets.domText,
      hiddenText: buckets.hiddenText,
      accessibilityText: dedupedAccessibility,
      imageText: [],
    },
    expectation,
    diagnostics: {
      elements: buckets.elements,
      comments: buckets.comments,
      emptyDropped: buckets.emptyDropped,
    },
  };
}
