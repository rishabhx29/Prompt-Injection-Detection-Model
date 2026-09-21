/**
 * Stage 2 — normalisation (FR-2.3–FR-2.6; architecture §6.2).
 *
 * Pipeline: `trim → drop empties → collapse whitespace → tag with view/source
 * kind/selector → deduplicate exact repeats → inspectable text segments`.
 *
 * Semantic (fuzzy) deduplication is deliberately **not** implemented in v1
 * (FR-2.5, S2 A3.3). Exact text plus source metadata is enough.
 */

import type {
  AccessibilityTextItem,
  PageRepresentation,
  ViewKind,
} from "@ctxvigil/shared-types";

/**
 * An independent observation channel.
 *
 * `visible_text` and `dom` are the **same** channel: text a sighted user sees is
 * necessarily also a DOM text node, so observing it in both is not independent
 * evidence. Hidden DOM, the accessibility tree, and OCR are genuinely separate
 * channels.
 *
 * This distinction is what stops `multi_view_repetition` from firing on every
 * ordinary page (see {@link TextSegment.channels}).
 */
export type ViewChannel = "rendered" | "hidden_dom" | "accessibility_tree" | "image";

/** Fixed view order. Determines segment ordering and dedupe precedence. */
export const VIEW_ORDER: readonly ViewKind[] = [
  "visible_text",
  "dom",
  "hidden_dom",
  "accessibility_tree",
  "image_text",
];

const CHANNEL_BY_VIEW: Record<ViewKind, ViewChannel> = {
  visible_text: "rendered",
  dom: "rendered",
  hidden_dom: "hidden_dom",
  accessibility_tree: "accessibility_tree",
  image_text: "image",
};

/**
 * Which view a collapsed segment reports as its primary provenance.
 *
 * Rule — **visible content reports `visible_text`; concealed content reports its
 * most concealed channel.**
 *
 * The rationale is what a reviewer needs to be told:
 *
 * - If the text is visible, the honest and useful statement is "this is in the
 *   visible text" — a sighted reviewer could have caught it themselves.
 * - If it is *not* visible, the surprising and important fact is *which* channel
 *   it hid in, so report the least-accessible channel it appears in.
 *
 * Checked against the contract fixtures:
 *
 * | Fixture | Views present | Reported |
 * |---|---|---|
 * | `visible-injection` | `visible_text`, `dom` | `visible_text` |
 * | `hidden-dom-injection` | `hidden_dom`, `dom` | `hidden_dom` |
 * | `aria-injection` | `dom`, `accessibility_tree` | `accessibility_tree` |
 * | `benign-aria-label` | `dom`, `accessibility_tree` | `accessibility_tree` |
 */
const CONCEALMENT_ORDER: readonly ViewKind[] = [
  "hidden_dom",
  "accessibility_tree",
  "image_text",
  "dom",
];

function pickPrimaryView(views: readonly ViewKind[]): ViewKind {
  if (views.includes("visible_text")) {
    return "visible_text";
  }
  for (const candidate of CONCEALMENT_ORDER) {
    if (views.includes(candidate)) {
      return candidate;
    }
  }
  // `views` is always non-empty, so this is unreachable; kept for exhaustiveness.
  return "dom";
}

/** Collapse all whitespace runs to single spaces and trim. */
export function normaliseWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

/**
 * One deduplicated, provenance-tagged piece of page content.
 *
 * Every segment is inspectable: a reviewer can see the exact text, where it came
 * from, and which channels supplied it.
 */
export interface TextSegment {
  /** Stable within a scan, e.g. `seg-1`. */
  id: string;
  /** Normalised text. Unique across the segment list. */
  text: string;
  /** Primary provenance — see {@link pickPrimaryView}. */
  view: ViewKind;
  /** Origin of the text, e.g. `aria-label`, `hidden-div`, `visible`. */
  sourceKind: string;
  /** Evidence location, when the caller supplied one. */
  selector: string | undefined;
  /** Every view the text was observed in, in {@link VIEW_ORDER} order. */
  views: ViewKind[];
  /** Distinct observation channels — the basis for `multi_view_repetition`. */
  channels: ViewChannel[];
  /** Global first-appearance order. Keeps output deterministic (NFR-1). */
  order: number;
}

/** A raw, pre-dedupe observation. */
interface RawObservation {
  text: string;
  view: ViewKind;
  sourceKind: string;
  selector: string | undefined;
  channel: ViewChannel;
  order: number;
}

/** Default `sourceKind` for each view when the caller supplies none. */
function defaultSourceKind(view: ViewKind): string {
  switch (view) {
    case "visible_text":
      return "visible";
    case "dom":
      return "dom";
    case "hidden_dom":
      return "hidden_dom";
    case "accessibility_tree":
      return "aria";
    case "image_text":
      return "ocr";
  }
}

function pushStrings(
  out: RawObservation[],
  values: readonly string[] | undefined,
  view: ViewKind,
  counter: { next: number },
): void {
  if (values === undefined) {
    return;
  }
  for (const value of values) {
    const text = normaliseWhitespace(value);
    counter.next += 1;
    if (text === "") {
      continue;
    }
    out.push({
      text,
      view,
      sourceKind: defaultSourceKind(view),
      selector: undefined,
      channel: CHANNEL_BY_VIEW[view],
      order: counter.next,
    });
  }
}

function pushAccessibility(
  out: RawObservation[],
  values: readonly (string | AccessibilityTextItem)[] | undefined,
  counter: { next: number },
): void {
  if (values === undefined) {
    return;
  }
  for (const value of values) {
    const isItem = typeof value === "object" && value !== null;
    const text = normaliseWhitespace(isItem ? (value as AccessibilityTextItem).text : (value as string));
    counter.next += 1;
    if (text === "") {
      continue;
    }
    const kind = isItem ? (value as AccessibilityTextItem).kind : undefined;
    const selector = isItem ? (value as AccessibilityTextItem).selector : undefined;
    out.push({
      text,
      view: "accessibility_tree",
      sourceKind: kind ?? "aria",
      selector: typeof selector === "string" ? selector : undefined,
      channel: CHANNEL_BY_VIEW.accessibility_tree,
      order: counter.next,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Main entry point                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Turn a `page` object into deduplicated, provenance-tagged segments.
 *
 * Deterministic for identical input (NFR-1): segments are emitted in
 * first-appearance order, which is why `order` exists rather than relying on
 * map iteration order.
 */
export function normalisePage(page: PageRepresentation): TextSegment[] {
  const counter = { next: 0 };
  const raw: RawObservation[] = [];

  // Fixed view order keeps `order` values stable regardless of key order in the
  // incoming JSON object.
  pushStrings(raw, page.visibleText, "visible_text", counter);
  pushStrings(raw, page.domText, "dom", counter);
  pushStrings(raw, page.hiddenText, "hidden_dom", counter);
  pushAccessibility(raw, page.accessibilityText, counter);
  pushStrings(raw, page.imageText, "image_text", counter);

  /** Exact-text dedupe (FR-2.5): no normalisation beyond whitespace. */
  const byText = new Map<string, RawObservation[]>();
  for (const observation of raw) {
    const existing = byText.get(observation.text);
    if (existing === undefined) {
      byText.set(observation.text, [observation]);
    } else {
      existing.push(observation);
    }
  }

  const segments: TextSegment[] = [];

  for (const [text, observations] of byText) {
    // First-appearance order across all views.
    const sorted = [...observations].sort((a, b) => a.order - b.order);
    const views = VIEW_ORDER.filter((view) => sorted.some((o) => o.view === view));
    const channels = [...new Set(sorted.map((o) => o.channel))].sort();
    const primaryView = pickPrimaryView(views);

    // Prefer the provenance supplied by an observation in the primary view, so a
    // structured `{ text, kind, selector }` ARIA item keeps its selector.
    const provenance =
      sorted.find((o) => o.view === primaryView) ?? (sorted[0] as RawObservation);

    segments.push({
      id: "",
      text,
      view: primaryView,
      sourceKind: provenance.sourceKind,
      selector: provenance.selector,
      views,
      channels,
      order: sorted[0]?.order ?? 0,
    });
  }

  segments.sort((a, b) => a.order - b.order);
  segments.forEach((segment, index) => {
    segment.id = `seg-${index + 1}`;
  });

  return segments;
}
