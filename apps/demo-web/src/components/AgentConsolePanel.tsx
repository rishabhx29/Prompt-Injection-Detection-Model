import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Shield, Eye, Lock, Unlock, Terminal
} from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';

/* -------------------------------------------------------------------------- */
/* Types mirroring apps/agent-demo (schemaVersion 1 run record)                */
/* -------------------------------------------------------------------------- */

interface AgentStep {
  id: string;
  title: string;
  detail: string;
  status: 'ok' | 'warn' | 'blocked';
}

interface ScanFinding {
  id: string;
  view: string;
  sourceKind: string;
  selector?: string;
  signals: string[];
  severity: string;
  scoreContribution: number;
  text: string;
}

interface ScanResponse {
  scanId: string;
  riskScore: number;
  riskLevel: string;
  decision: string;
  findings: ScanFinding[];
  safeContent: Array<{ text: string }>;
  blockedContent: string[];
  sanitizedContent: string[];
  summary: string;
}

interface ActionResponse {
  decision: string;
  allowed: boolean;
  confirmationRequired: boolean;
  riskScore: number;
  reason: string;
}

interface AgentRunResult {
  schemaVersion: 1;
  runId: string;
  startedAt: string;
  durationMs: number;
  url: string;
  scenarioId?: string;
  scenarioTitle?: string;
  userTask: string;
  plan: { type: string; label: string; riskCategory: string; source: string };
  fetch: { status: number; bytes: number; elapsedMs: number; transport: string };
  extraction: {
    counts: { visible: number; dom: number; hidden: number; accessibility: number };
  };
  scan: ScanResponse;
  action: { request: unknown; response: ActionResponse };
  agentContext: { approvedSegments: number; withheldSegments: number };
  assertion: {
    expectedDecision?: string;
    observedDecision: string;
    observedRiskLevel: string;
    matched: boolean | null;
    gateDecision: string | null;
  };
  steps: AgentStep[];
}

interface AgentRunRecord {
  schemaVersion: 1;
  generatedAt: string;
  agent: { kind: string; isLlm: boolean; note: string };
  engine: { package: string; mode: string };
  transport: string;
  runs: AgentRunResult[];
  summary: {
    episodes: number;
    matched: number;
    mismatched: number;
    blocked: number;
    escalated: number;
    allowed: number;
    withheldSegments: number;
  };
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

const DECISION_COLOR: Record<string, string> = {
  allow: '#059669',
  sanitize: '#d97706',
  confirm: '#7c3aed',
  block: '#e11d48'
};

const CHIP_RGB: Record<string, string> = {
  '#059669': '5, 150, 105',
  '#e11d48': '225, 29, 72',
  '#d97706': '217, 119, 6',
  '#7c3aed': '124, 58, 237',
  '#0369a1': '2, 132, 199'
};

const STEP_ICON: Record<AgentStep['status'], React.ReactNode> = {
  ok: <CheckCircle2 size={14} color="#059669" />,
  warn: <AlertTriangle size={14} color="#d97706" />,
  blocked: <XCircle size={14} color="#e11d48" />
};

function decisionColor(decision: string): string {
  return DECISION_COLOR[decision] ?? '#d97706';
}

const compact: React.CSSProperties = {
  fontSize: '0.72rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-secondary)'
};

const chip: React.CSSProperties = {
  fontSize: '0.66rem',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  border: '1px solid'
};

function Chip({ text, color }: { text: string; color: string }) {
  const rgb = CHIP_RGB[color] ?? '100, 116, 139';
  return (
    <span style={{ ...chip, color, background: `rgba(${rgb}, 0.12)`, borderColor: `rgba(${rgb}, 0.35)` }}>
      {text}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* The panel                                                                   */
/* --------------------------------------------------------------------------- */

export const AgentConsolePanel: React.FC = () => {
  const [record, setRecord] = useState<AgentRunRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/agent-runs/latest.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = (await response.json()) as AgentRunRecord;
      setRecord(parsed);
      setSelectedRun(0);
    } catch (cause) {
      setError(
        `No agent run record found (${cause instanceof Error ? cause.message : String(cause)}). ` +
          'Run "npm run agent:demo" to produce one.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = record?.runs[selectedRun];
  const summary = record?.summary;

  return (
    <DoubleBezelCard
      glowColor="rgba(2, 132, 199, 0.25)"
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="var(--accent-cyan)" />
          <span>Agent Console — Live Agent Episodes</span>
        </div>
      }
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {record && (
            <span style={compact}>
              {record.agent.isLlm ? 'LLM agent' : 'local scripted agent'} · ctxvigil SDK in-process ·{' '}
              {record.transport} transport
            </span>
          )}
          <button
            onClick={() => void load()}
            disabled={isLoading}
            title="Refetch the latest recorded agent run (produced by npm run agent:demo)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              font: 'inherit',
              fontSize: '0.7rem',
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: '#f8fafc',
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : undefined} />
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      }
      innerStyle={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* What the run is */}
      {record && (
        <p style={{ ...compact, margin: 0 }}>
          <Bot size={11} style={{ verticalAlign: '-1px' }} /> A web agent fetched each fixture page over
          HTTP, read it through 4 observation channels (visible / DOM / hidden DOM / accessibility tree),
          and the <strong>ctxvigil</strong> layer decided what it may read and do. The agent itself has no
          model and makes no detection decisions — every verdict is the layer's.
        </p>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.78rem',
            color: '#b45309'
          }}
        >
          <AlertTriangle size={12} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
          {error}
        </div>
      )}

      {/* Summary strip */}
      {summary && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <Chip text={`${summary.episodes} episodes`} color="#0369a1" />
          <Chip text={`${summary.blocked} blocked`} color="#e11d48" />
          <Chip text={`${summary.escalated} escalated`} color="#d97706" />
          <Chip text={`${summary.allowed} allowed`} color="#059669" />
          <Chip text={`${summary.withheldSegments} segments withheld`} color="#e11d48" />
          <Chip
            text={
              summary.mismatched === 0
                ? `${summary.matched}/${summary.episodes} verdict assertions PASS`
                : `${summary.mismatched} assertion(s) FAIL`
            }
            color={summary.mismatched === 0 ? '#059669' : '#e11d48'}
          />
        </div>
      )}

      {/* Episode selector */}
      {record && record.runs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {record.runs.map((candidate, index) => {
            const color = decisionColor(candidate.scan.decision);
            const rgb = CHIP_RGB[color] ?? '100, 116, 139';
            return (
              <button
                key={candidate.runId}
                onClick={() => setSelectedRun(index)}
                style={{
                  font: 'inherit',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  border: `1px solid ${index === selectedRun ? color : 'var(--border-subtle)'}`,
                  background: index === selectedRun ? `rgba(${rgb}, 0.1)` : '#fff',
                  color: index === selectedRun ? color : 'var(--text-secondary)',
                  fontWeight: index === selectedRun ? 700 : 400
                }}
              >
                {candidate.scenarioId ?? candidate.url}
                <span style={{ marginLeft: '6px', fontWeight: 700 }}>{candidate.scan.decision}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected episode */}
      {run && (
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                {run.scenarioTitle ?? run.url}
              </div>
              <div style={compact}>
                {run.url} · {run.fetch.bytes} bytes · task "{run.userTask}"
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Chip text={`scan ${run.scan.decision} ${run.scan.riskScore}`} color={decisionColor(run.scan.decision)} />
              <Chip
                text={`gate ${run.action.response.decision}`}
                color={run.action.response.allowed ? '#059669' : '#e11d48'}
              />
              <Chip
                text={
                  run.assertion.matched === null
                    ? 'no assertion'
                    : run.assertion.matched
                      ? 'assertion PASS'
                      : 'assertion FAIL'
                }
                color={run.assertion.matched === false ? '#e11d48' : '#059669'}
              />
            </div>
          </div>

          {/* What the agent saw vs what was withheld */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ ...compact, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={11} /> {run.extraction.counts.visible} visible · {run.extraction.counts.hidden} hidden-DOM ·{' '}
              {run.extraction.counts.accessibility} AX entries
            </span>
            {run.agentContext.withheldSegments > 0 ? (
              <span style={{ ...compact, display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b91c1c' }}>
                <Lock size={11} /> {run.agentContext.withheldSegments} segment(s) withheld from the agent's context
              </span>
            ) : (
              <span style={{ ...compact, display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669' }}>
                <Unlock size={11} /> nothing withheld — the agent read the whole approved page
              </span>
            )}
          </div>

          {/* Step timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {run.steps.map((step) => (
              <div key={step.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ marginTop: '1px' }}>{STEP_ICON[step.status]}</span>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#0f172a' }}>{step.title}</div>
                  <div style={compact}>{step.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Findings with provenance */}
          {run.scan.findings.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              {run.scan.findings.map((finding) => (
                <div key={finding.id} style={{ marginBottom: '6px' }}>
                  <div style={{ ...compact, color: '#4f46e5', fontWeight: 700 }}>
                    <Shield size={10} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                    {finding.view}
                    {finding.selector !== undefined ? ` ${finding.selector}` : ''} +{finding.scoreContribution} ·{' '}
                    {finding.signals.join(', ')}
                  </div>
                  <div style={compact}>"{finding.text.length > 130 ? `${finding.text.slice(0, 129)}…` : finding.text}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DoubleBezelCard>
  );
};

export default AgentConsolePanel;
