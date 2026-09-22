/**
 * Shared API Contract for AgentGuard
 * Aligned with requirement/TEAM_DEVELOPMENT_PLAN.md (Section 4)
 * 
 * DO NOT modify without team consensus.
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Decision = 'allow' | 'sanitize' | 'confirm' | 'block';
export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SourceViewType = 
  | 'visible_text' 
  | 'dom' 
  | 'hidden_dom' 
  | 'accessibility_tree' 
  | 'image_ocr';

export interface AccessibilityTextEntry {
  text: string;
  kind: 'aria-label' | 'alt' | 'role_description' | 'hidden_span';
  selector?: string;
}

export interface PageRepresentation {
  url: string;
  title: string;
  visibleText: string[];
  domText: string[];
  hiddenText?: string[];
  accessibilityText: AccessibilityTextEntry[];
  imageText?: string[];
}

export interface ScanPageRequest {
  scanId: string;
  userTask: string;
  page: PageRepresentation;
}

export interface Finding {
  id: string;
  view: SourceViewType;
  sourceKind?: string;
  selector?: string;
  text: string;
  signals: string[];
  severity: FindingSeverity;
  scoreContribution: number;
}

export interface SafeContentItem {
  text: string;
  view: string;
}

export interface ScanPageResponse {
  scanId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  decision: Decision;
  summary: string;
  findings: Finding[];
  safeContent: SafeContentItem[];
  sanitizedContent: string[];
  blockedContent: string[];
}

export interface ProposedAction {
  type: string;
  label: string;
  riskCategory: 'general' | 'account_change' | 'data_exfiltration' | 'form_submission' | 'financial';
  triggeredByFindingIds?: string[];
}

export interface CheckActionRequest {
  scanId: string;
  userTask: string;
  proposedAction: ProposedAction;
}

export interface CheckActionResponse {
  decision: Decision;
  riskScore: number;
  reason: string;
  allowed: boolean;
  confirmationRequired: boolean;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  version: string;
  timestamp: string;
}
