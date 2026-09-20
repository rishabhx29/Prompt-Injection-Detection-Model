/**
 * Machine-readable errors.
 *
 * Codes and HTTP mappings are fixed by `docs/03_API_CONTRACT.md` §9.1.
 *
 * **Fail closed:** no code path may convert an internal failure into `allow`
 * (architecture §7). A protection layer that returns `allow` when it is
 * confused is worse than one that fails loudly.
 */

import type { ErrorCode } from "@ctxvigil/shared-types";

/** HTTP status for each error code, per contract §9.1. */
const STATUS_BY_CODE: Record<ErrorCode, 400 | 404 | 500> = {
  INVALID_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

/**
 * The single error type thrown by CtxVigil.
 *
 * The HTTP adapter maps this directly onto a status code and an
 * {@link ErrorResponse} body, so it never needs its own error logic (FR-6.8).
 */
export class CtxVigilError extends Error {
  /** Machine-readable code, contract §9.1. */
  readonly code: ErrorCode;

  /** The offending request field, when the failure is field-specific. */
  readonly field: string | undefined;

  constructor(code: ErrorCode, message: string, field?: string) {
    super(message);
    this.name = "CtxVigilError";
    this.code = code;
    this.field = field;
  }

  /** HTTP status the adapter should return for this error. */
  get status(): 400 | 404 | 500 {
    return STATUS_BY_CODE[this.code];
  }

  /** Contract-shaped error body, safe to send to a client. */
  toResponse(): { error: { code: ErrorCode; message: string; field?: string } } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.field === undefined ? {} : { field: this.field }),
      },
    };
  }
}

/** Convenience constructor for validation failures (HTTP 400). */
export function invalidRequest(message: string, field?: string): CtxVigilError {
  return new CtxVigilError("INVALID_REQUEST", message, field);
}

/** Convenience constructor for unexpected internal failures (HTTP 500). */
export function internalError(message: string): CtxVigilError {
  return new CtxVigilError("INTERNAL_ERROR", message);
}

/** True when the value is a CtxVigilError. Used at the package boundary. */
export function isCtxVigilError(value: unknown): value is CtxVigilError {
  return value instanceof CtxVigilError;
}
