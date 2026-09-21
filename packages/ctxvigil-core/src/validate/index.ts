/**
 * Stage 1 — validation (FR-2.1, FR-2.2; architecture §6.1).
 *
 * Rejects malformed input with a machine-readable {@link CtxVigilError} rather
 * than letting a raw `TypeError` escape. Missing content arrays are **not**
 * errors — they default to `[]`. Missing views must never cause a failure.
 */

import type {
  AccessibilityTextItem,
  CheckActionRequest,
  PageRepresentation,
  ScanPageRequest,
} from "@ctxvigil/shared-types";
import { invalidRequest } from "../errors.ts";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidRequest(`${field} is required and must be a string.`, field);
  }
  if (value.trim() === "") {
    throw invalidRequest(`${field} is required and must be a non-empty string.`, field);
  }
  return value;
}

/** Validate an optional string field: absent is fine, present-but-not-string is not. */
function optionalString(value: unknown, field: string): void {
  if (value !== undefined && typeof value !== "string") {
    throw invalidRequest(`${field} must be a string when present.`, field);
  }
}

/**
 * Validate an individual accessibility item.
 *
 * Accepts both bare strings and `{ text, kind?, selector? }` objects (FR-2.4).
 */
function validateAccessibilityItem(value: unknown, index: number): void {
  const field = `page.accessibilityText[${index}]`;

  if (typeof value === "string") {
    return;
  }

  if (!isPlainObject(value)) {
    throw invalidRequest(`${field} must be a string or an object with a "text" field.`, field);
  }

  if (typeof value["text"] !== "string") {
    throw invalidRequest(`${field}.text is required and must be a string.`, `${field}.text`);
  }

  for (const key of ["kind", "selector"] as const) {
    optionalString(value[key], `${field}.${key}`);
  }
}

/** Validate one optional string array. Absent is fine; wrong type is not. */
function validateStringArray(value: unknown, field: string): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw invalidRequest(`${field} must be an array of strings when present.`, field);
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== "string") {
      throw invalidRequest(`${field}[${i}] must be a string.`, `${field}[${i}]`);
    }
  }
}

/** Validate the `page` object. Every content array is optional (FR-2.2). */
function validatePage(value: unknown): PageRepresentation {
  if (value === undefined || value === null) {
    throw invalidRequest("page is required.", "page");
  }
  if (!isPlainObject(value)) {
    throw invalidRequest("page must be an object.", "page");
  }

  for (const key of ["url", "title"] as const) {
    optionalString(value[key], `page.${key}`);
  }

  validateStringArray(value["visibleText"], "page.visibleText");
  validateStringArray(value["domText"], "page.domText");
  validateStringArray(value["hiddenText"], "page.hiddenText");
  validateStringArray(value["imageText"], "page.imageText");

  const accessibility = value["accessibilityText"];
  if (accessibility !== undefined) {
    if (!Array.isArray(accessibility)) {
      throw invalidRequest(
        "page.accessibilityText must be an array when present.",
        "page.accessibilityText",
      );
    }
    accessibility.forEach((item, index) => {
      validateAccessibilityItem(item, index);
    });
  }

  return value as PageRepresentation;
}

/* -------------------------------------------------------------------------- */
/* Public validators                                                          */
/* -------------------------------------------------------------------------- */

/** Validate a `ScanPageRequest`. Throws {@link CtxVigilError} on failure. */
export function validateScanPageRequest(input: unknown): ScanPageRequest {
  if (!isPlainObject(input)) {
    throw invalidRequest("Request body must be a JSON object.");
  }

  const scanId = requireNonEmptyString(input["scanId"], "scanId");
  const userTask = requireNonEmptyString(input["userTask"], "userTask");
  const page = validatePage(input["page"]);

  return { scanId, userTask, page };
}

/** Validate a `CheckActionRequest`. Throws {@link CtxVigilError} on failure. */
export function validateCheckActionRequest(input: unknown): CheckActionRequest {
  if (!isPlainObject(input)) {
    throw invalidRequest("Request body must be a JSON object.");
  }

  const scanId = requireNonEmptyString(input["scanId"], "scanId");
  const userTask = requireNonEmptyString(input["userTask"], "userTask");

  const action = input["proposedAction"];
  if (!isPlainObject(action)) {
    throw invalidRequest("proposedAction is required and must be an object.", "proposedAction");
  }

  const type = requireNonEmptyString(action["type"], "proposedAction.type");

  optionalString(action["label"], "proposedAction.label");
  optionalString(action["riskCategory"], "proposedAction.riskCategory");
  const label = action["label"];
  const riskCategory = action["riskCategory"];

  validateStringArray(action["triggeredByFindingIds"], "proposedAction.triggeredByFindingIds");

  const triggeredByFindingIds = action["triggeredByFindingIds"];
  const proposedAction: CheckActionRequest["proposedAction"] = { type };
  if (typeof label === "string") {
    proposedAction.label = label;
  }
  if (typeof riskCategory === "string") {
    proposedAction.riskCategory = riskCategory;
  }
  if (triggeredByFindingIds !== undefined) {
    proposedAction.triggeredByFindingIds = triggeredByFindingIds as string[];
  }

  return { scanId, userTask, proposedAction };
}

/** Re-exported for callers that build accessibility items programmatically. */
export type { AccessibilityTextItem };
