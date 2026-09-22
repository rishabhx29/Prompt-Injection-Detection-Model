import React, { useState } from 'react';
import type { Finding } from '../types/agentguard-contract';
import { 
  AlertCircle, 
  ShieldCheck, 
  Tag, 
  ChevronDown, 
  ChevronRight, 
  Info, 
  Radio, 
  Crosshair 
} from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';

interface FindingsListProps {
  findings: Finding[];
}

// Heuristic explanations dictionary
const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  instruction_override: 'Imperative phrasing detected attempting to divert agent system prompt instructions.',
  task_conflict: 'Action or context explicitly conflicts with the user’s authorized task.',
  hidden_content: 'Instruction is obfuscated in non-visible accessibility trees or hidden DOM tags.',
  risky_action: 'Target incites high-risk account, credential, or data modification.',
  imperative_label: 'Standard imperative accessible label for interactive control (evaluated as benign).'
};

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [findings[0]?.id || '']: true // auto-expand first finding
  });

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totalContribution = findings.reduce((sum, f) => sum + f.scoreContribution, 0);

  if (findings.length === 0) {
    return (
      <DoubleBezelCard
        headerLeft={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--status-allow)" />
            <span>Security Findings Audit</span>
          </div>
        }
        headerRight={
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            0 Threats Detected
          </span>
        }
      >
        <div
          style={{
            padding: '16px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            color: '#6ee7b7',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Verified Clean Baseline</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
              No hostile instruction overrides, task deviations, or injection vectors were detected across any representation channel.
            </div>
          </div>
        </div>
      </DoubleBezelCard>
    );
  }

  return (
    <DoubleBezelCard
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#ef4444" />
          <span>Security Findings Intelligence</span>
        </div>
      }
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}
          >
            ∑ +{totalContribution} pts
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)'
            }}
          >
            {findings.length} Flagged
          </span>
        </div>
      }
      innerStyle={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {findings.map((f) => {
        const isExpanded = !!expandedIds[f.id];
        const isCritical = f.severity === 'critical' || f.severity === 'high';

        return (
          <div
            key={f.id}
            style={{
              background: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: isCritical ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Clickable Card Header */}
            <div
              onClick={() => toggleExpand(f.id)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
                background: 'rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isExpanded ? (
                  <ChevronDown size={14} color="var(--text-muted)" />
                ) : (
                  <ChevronRight size={14} color="var(--text-muted)" />
                )}
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: isCritical ? '#f87171' : '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Radio size={12} />
                  <span>{f.id.toUpperCase()}</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                      color: isCritical ? '#fca5a5' : '#fde68a'
                    }}
                  >
                    {f.severity.toUpperCase()}
                  </span>
                </span>
              </div>

              {/* Score Math Contribution Chip */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                  color: isCritical ? '#fca5a5' : '#fde68a',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: isCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                }}
              >
                +{f.scoreContribution} Score
              </span>
            </div>

            {/* Injected Content Excerpt */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: '#fca5a5',
                  lineHeight: 1.5,
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  borderLeft: isCritical ? '3px solid #ef4444' : '3px solid #f59e0b',
                  wordBreak: 'break-all'
                }}
              >
                "{f.text}"
              </div>

              {/* Source Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Tag size={10} />
                  <span>Channel: {f.view}</span>
                </span>

                {f.selector && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#a5b4fc',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Crosshair size={10} />
                    <span>Selector: {f.selector}</span>
                  </span>
                )}
              </div>

              {/* Expandable Heuristics Intelligence */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Triggered Security Signals:
                  </div>

                  {f.signals.map(sig => (
                    <div
                      key={sig}
                      style={{
                        fontSize: '0.72rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px'
                      }}
                    >
                      <Info size={12} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#c7d2fe', fontFamily: 'var(--font-mono)' }}>{sig}</strong>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', marginTop: '1px' }}>
                          {SIGNAL_DESCRIPTIONS[sig] || 'Anomalous prompt structure flagged by multi-view parser.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </DoubleBezelCard>
  );
};

export default FindingsList;
