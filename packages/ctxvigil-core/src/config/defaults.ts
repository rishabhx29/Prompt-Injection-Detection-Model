/**
 * Documented defaults and the configuration resolver.
 *
 * All phrase lists and category tables live here — **never** inline in a
 * detector, route handler, or CLI branch (FR-3.10, NFR-11).
 *
 * ## Two rules for editing the tables below
 *
 * 1. A pattern describes a **class** of attack. A fixture sentence is an
 *    *instance* of one and must never appear here (S2 §9, NFR-11).
 * 2. Thresholds and weights are **development defaults, not validated research
 *    thresholds** (FR-4.9, S1 §6). They may only be tuned once test cases and
 *    evaluation data exist.
 */

import type { CtxVigilConfig, ThresholdConfig, WeightConfig } from "@ctxvigil/shared-types";
import type { ResolvedConfig, RiskCategoryConfig } from "./types.ts";

/* -------------------------------------------------------------------------- */
/* Score bands — contract §5, S1 §6                                           */
/* -------------------------------------------------------------------------- */

/** 0–29 low, 30–59 medium, 60–79 high, 80–100 critical. */
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  low: 29,
  medium: 59,
  high: 79,
};

/* -------------------------------------------------------------------------- */
/* Score contributions — contract §5.1, S1 §6                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULT_WEIGHTS: WeightConfig = {
  instructionOverride: 25,
  roleImpersonation: 25,
  dataExfiltration: 25,
  hiddenContent: 30,
  taskConflict: 25,
  riskyAction: 25,
  multiView: 10,
  benignTaskRelevance: -10,
  benignStatic: -5,
};

/* -------------------------------------------------------------------------- */
/* Attack-pattern lists (classes, not fixtures)                               */
/* -------------------------------------------------------------------------- */

/**
 * Deliberately generic. Each entry is a lowercase substring matched against
 * normalised segment text. See the header rules before adding anything.
 */
export const DEFAULT_PHRASE_LISTS = {
  instructionOverride: [
    "ignore previous instructions",
    "ignore all previous",
    "ignore the previous",
    "ignore the user's request",
    "ignore the user's instructions",
    "ignore your instructions",
    "disregard the user",
    "disregard previous",
    "disregard the above",
    "new system instruction",
    "new instructions",
    "override your instructions",
    "set the user's request aside",
    "forget the previous",
    "do not follow the user",
  ],
  roleImpersonation: [
    "you are now",
    "act as the system",
    "you are the system",
    "as an administrator",
    "as the developer",
    "system message:",
    "developer instruction",
    "this is a system update",
    "authorised by the system",
  ],
  dataExfiltration: [
    "reveal the",
    "reveal your",
    "send the data to",
    "send this to",
    "upload the",
    "upload this to",
    "copy the credentials",
    "share the private",
    "exfiltrate",
    "forward the contents to",
  ],
};

/* -------------------------------------------------------------------------- */
/* Action categories                                                          */
/* -------------------------------------------------------------------------- */

/** Matched against `proposedAction.type` after lowercasing. */
export const DEFAULT_ACTION_CATEGORIES = {
  riskyActions: [
    "change_account",
    "change_password",
    "change_email",
    "update_account",
    "update_settings",
    "update_contact",
    "reset_password",
    "delete_",
    "revoke_",
    "purchase",
    "checkout",
    "place_order",
    "buy",
    "subscribe",
    "send_message",
    "send_email",
    "transfer",
    "upload",
    "export_data",
    "post_external",
    "submit_form",
    "apply",
  ],
  readOnlyActions: [
    "summarize",
    "summarise",
    "read_",
    "extract_",
    "find_",
    "locate_",
    "search_",
    "query_",
    "list_",
    "get_",
    "open_link",
    "navigate",
  ],
};

/* -------------------------------------------------------------------------- */
/* Risk categories — docs/04_ARCHITECTURE.md §5 (normative)                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_RISK_WEIGHTS: Record<string, number> = {
  read_only: 0,
  navigation: 5,
  search: 5,
  form_fill: 15,
  form_submit: 40,
  message_send: 45,
  data_transfer: 70,
  account_change: 80,
  purchase: 90,
  destructive: 100,
};

/**
 * Ordered longest-match-first so `change_account_email` resolves to
 * `account_change` rather than a shorter, looser pattern.
 */
const DEFAULT_RISK_INFERENCE: Array<{ category: string; patterns: string[] }> = [
  {
    category: "destructive",
    patterns: ["delete_account", "delete_data", "revoke_access", "delete_", "revoke_"],
  },
  {
    category: "purchase",
    patterns: ["purchase", "checkout", "place_order", "buy", "subscribe", "payment"],
  },
  {
    category: "account_change",
    patterns: [
      "change_account",
      "change_password",
      "change_email",
      "update_account",
      "update_settings",
      "update_contact",
      "update_email",
      "reset_password",
      "change_setting",
    ],
  },
  {
    category: "data_transfer",
    patterns: ["upload", "export_data", "post_external", "transfer", "share_external"],
  },
  {
    category: "message_send",
    patterns: ["send_message", "send_email", "draft_and_send", "message_send"],
  },
  { category: "form_submit", patterns: ["submit_form", "submit_", "apply", "send_form"] },
  { category: "form_fill", patterns: ["fill_field", "fill_", "select_option", "type_"] },
  { category: "search", patterns: ["search_", "query_", "find_document"] },
  { category: "navigation", patterns: ["open_link", "go_to", "navigate", "open_page"] },
  {
    category: "read_only",
    patterns: [
      "summarize",
      "summarise",
      "read_page",
      "read_",
      "extract_",
      "find_",
      "locate_",
      "list_",
      "get_",
    ],
  },
];

const DEFAULT_RISK_CATEGORIES: RiskCategoryConfig = {
  weights: DEFAULT_RISK_WEIGHTS,
  inference: DEFAULT_RISK_INFERENCE,
  // Never assume an unclassifiable action is safe (FR-5.9).
  unknownWeight: 60,
  // A read-only action that directly serves the user's task.
  taskAlignedReadOnlyWeight: 0,
};

/* -------------------------------------------------------------------------- */
/* Generic detector word tables (classes, not fixtures)                       */
/* -------------------------------------------------------------------------- */

/**
 * Deliberately generic English word tables used by the relation-based detectors
 * (`data_exfiltration`, `risky_action`, `task_conflict`). Like the phrase lists
 * above, each entry names a **class** of wording; a fixture sentence must never
 * appear here (S2 §9, NFR-11). Kept in this data file per FR-3.10.
 */
export const DEFAULT_DETECTOR_LEXICON = {
  /** Function words (articles, pronouns, auxiliaries, prepositions) that carry no task meaning. */
  taskStopwords: [
    "a",
    "about",
    "after",
    "again",
    "against",
    "all",
    "also",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "behind",
    "below",
    "beneath",
    "beside",
    "between",
    "beyond",
    "both",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "doing",
    "done",
    "down",
    "during",
    "each",
    "except",
    "for",
    "from",
    "further",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "him",
    "his",
    "how",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "just",
    "me",
    "more",
    "most",
    "my",
    "near",
    "no",
    "nor",
    "not",
    "now",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "our",
    "out",
    "over",
    "own",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "upon",
    "us",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "within",
    "without",
    "would",
    "you",
    "your",
  ],
  /** Nouns that denote private or sensitive material. */
  sensitiveObjectNouns: [
    "account",
    "address",
    "card",
    "code",
    "credential",
    "credentials",
    "data",
    "details",
    "document",
    "documents",
    "email",
    "file",
    "files",
    "inbox",
    "information",
    "key",
    "keys",
    "message",
    "messages",
    "money",
    "number",
    "password",
    "payment",
    "payments",
    "phone",
    "photo",
    "photos",
    "private",
    "profile",
    "record",
    "records",
    "secret",
    "secrets",
    "settings",
    "ssn",
    "token",
    "tokens",
  ],
  /** Verbs that move or disclose material. */
  transferVerbs: [
    "collect",
    "copy",
    "disclose",
    "export",
    "exfiltrate",
    "forward",
    "post",
    "publish",
    "reveal",
    "sell",
    "send",
    "share",
    "transfer",
    "transmit",
    "upload",
  ],
  /** Nouns that denote a high-risk operation target. */
  highRiskOperationNouns: [
    "account",
    "accounts",
    "address",
    "backup",
    "card",
    "checkout",
    "credentials",
    "data",
    "database",
    "details",
    "email",
    "emails",
    "order",
    "orders",
    "password",
    "payment",
    "payments",
    "plan",
    "purchase",
    "records",
    "settings",
    "subscription",
  ],
  /** Verbs that perform or request a state-changing operation. */
  operationVerbs: [
    "buy",
    "cancel",
    "change",
    "delete",
    "disable",
    "order",
    "pay",
    "purchase",
    "remove",
    "reset",
    "revoke",
    "send",
    "share",
    "submit",
    "transfer",
    "update",
    "upload",
  ],
};

/* -------------------------------------------------------------------------- */
/* Resolution                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Merge a caller-supplied partial config over the defaults.
 *
 * The merge is shallow **per section**: supplying `thresholds` must not discard
 * the default phrase lists (architecture §8.1).
 */
export function resolveConfig(config: CtxVigilConfig = {}): ResolvedConfig {
  return {
    thresholds: { ...DEFAULT_THRESHOLDS, ...config.thresholds },
    weights: { ...DEFAULT_WEIGHTS, ...config.weights },
    phraseLists: {
      instructionOverride: [
        ...(config.phraseLists?.instructionOverride ?? DEFAULT_PHRASE_LISTS.instructionOverride),
      ],
      roleImpersonation: [
        ...(config.phraseLists?.roleImpersonation ?? DEFAULT_PHRASE_LISTS.roleImpersonation),
      ],
      dataExfiltration: [
        ...(config.phraseLists?.dataExfiltration ?? DEFAULT_PHRASE_LISTS.dataExfiltration),
      ],
    },
    detectorLexicon: resolveDetectorLexicon(config.detectorLexicon),
    actionCategories: {
      riskyActions: [
        ...(config.actionCategories?.riskyActions ?? DEFAULT_ACTION_CATEGORIES.riskyActions),
      ],
      readOnlyActions: [
        ...(config.actionCategories?.readOnlyActions ?? DEFAULT_ACTION_CATEGORIES.readOnlyActions),
      ],
    },
    riskCategories: {
      weights: { ...DEFAULT_RISK_WEIGHTS, ...config.riskCategories },
      inference: DEFAULT_RISK_INFERENCE,
      unknownWeight: DEFAULT_RISK_CATEGORIES.unknownWeight,
      taskAlignedReadOnlyWeight: DEFAULT_RISK_CATEGORIES.taskAlignedReadOnlyWeight,
    },
  };
}

/**
 * Merge caller-supplied detector word-table overrides over the defaults.
 *
 * Each table is a flat word list, so the merge is per-table replacement of that
 * table only (mirrors the shallow per-section rule in architecture §8.1).
 */
function resolveDetectorLexicon(
  overrides?: CtxVigilConfig["detectorLexicon"],
): ResolvedConfig["detectorLexicon"] {
  return {
    taskStopwords: [...(overrides?.taskStopwords ?? DEFAULT_DETECTOR_LEXICON.taskStopwords)],
    sensitiveObjectNouns: [
      ...(overrides?.sensitiveObjectNouns ?? DEFAULT_DETECTOR_LEXICON.sensitiveObjectNouns),
    ],
    transferVerbs: [...(overrides?.transferVerbs ?? DEFAULT_DETECTOR_LEXICON.transferVerbs)],
    highRiskOperationNouns: [
      ...(overrides?.highRiskOperationNouns ?? DEFAULT_DETECTOR_LEXICON.highRiskOperationNouns),
    ],
    operationVerbs: [...(overrides?.operationVerbs ?? DEFAULT_DETECTOR_LEXICON.operationVerbs)],
  };
}

