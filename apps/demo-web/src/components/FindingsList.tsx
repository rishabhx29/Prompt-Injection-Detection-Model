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
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
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
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
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
          <AlertCircle size={16} color="#e11d48" />
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
              background: '#fff1f2',
              color: '#e11d48',
              border: '1px solid #fecdd3'
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
              background: isCritical ? '#fff1f2' : '#fffbeb',
              border: isCritical ? '1px solid #fecdd3' : '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
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
                background: '#ffffff'
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
                    color: isCritical ? '#e11d48' : '#d97706',
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
                      background: isCritical ? '#ffe4e6' : '#fef3c7',
                      color: isCritical ? '#9f1239' : '#92400e'
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
                  background: isCritical ? '#ffe4e6' : '#fef3c7',
                  color: isCritical ? '#9f1239' : '#92400e',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: isCritical ? '1px solid #fecdd3' : '1px solid #fde68a'
                }}
              >
                +{f.scoreContribution} Score
              </span>
            </div>

            {/* Injected Content Excerpt */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: isCritical ? '#9f1239' : '#92400e',
                  lineHeight: 1.5,
                  background: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  borderLeft: isCritical ? '3px solid #e11d48' : '3px solid #d97706',
                  borderTop: '1px solid var(--border-subtle)',
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
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
                    background: '#f1f5f9',
                    color: 'var(--text-secondary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
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
                      background: '#f0f9ff',
                      color: '#0284c7',
                      border: '1px solid #bae6fd',
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
                    borderTop: '1px dashed var(--border-subtle)',
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
                        background: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px'
                      }}
                    >
                      <Info size={12} color="#4f46e5" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>{sig}</strong>
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
