import React, { useState } from 'react';
import type { FixtureScenario } from '../fixtures/types';
import type { ScanPageResponse } from '../types/agentguard-contract';
import { Eye, Code, Accessibility, AlertTriangle, CheckCircle2, Copy, Check, Terminal } from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';

interface MultiViewInspectorProps {
  fixture: FixtureScenario;
  scanResult: ScanPageResponse | null;
}

type TabType = 'visible' | 'dom' | 'accessibility';

export const MultiViewInspector: React.FC<MultiViewInspectorProps> = ({
  fixture,
  scanResult
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('accessibility');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const page = fixture.scanRequest.page;
  const findings = scanResult ? scanResult.findings : [];

  // Count threats per channel
  const ariaFindings = findings.filter(f => f.view === 'accessibility_tree');
  const visibleFindings = findings.filter(f => f.view === 'visible_text');
  const domFindings = findings.filter(f => f.view === 'dom' || f.view === 'hidden_dom');

  // Check whether a discrepancy exists (e.g. visible has 0 threats, but AXTree has threats)
  const hasDiscrepancy = visibleFindings.length === 0 && ariaFindings.length > 0;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <DoubleBezelCard
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="var(--accent-cyan)" />
          <span>Multi-View Representation Audit</span>
        </div>
      }
      headerRight={
        <span
          style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)'
          }}
        >
          3 Channels Active
        </span>
      }
      innerStyle={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%'
      }}
    >
      {/* Tab Navigation with Threat Count Badges */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '4px',
          background: 'rgba(0, 0, 0, 0.45)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Visible Text Tab */}
        <button
          onClick={() => setActiveTab('visible')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'visible' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'visible' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)'
          }}
        >
          <Eye size={14} />
          <span>Visible</span>
          {visibleFindings.length > 0 ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: '#ef4444',
                color: '#fff',
                fontWeight: 700
              }}
            >
              {visibleFindings.length}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 5px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)'
              }}
            >
              0
            </span>
          )}
        </button>

        {/* Raw DOM Tab */}
        <button
          onClick={() => setActiveTab('dom')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'dom' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'dom' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)'
          }}
        >
          <Code size={14} />
          <span>Raw DOM</span>
          {domFindings.length > 0 ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#fff',
                fontWeight: 700
              }}
            >
              {domFindings.length}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 5px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)'
              }}
            >
              0
            </span>
          )}
        </button>

        {/* AXTree / ARIA Tab */}
        <button
          onClick={() => setActiveTab('accessibility')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'accessibility' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'accessibility' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)'
          }}
        >
          <Accessibility size={14} />
          <span>AXTree / ARIA</span>
          {ariaFindings.length > 0 ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: '#ef4444',
                color: '#fff',
                fontWeight: 700
              }}
            >
              {ariaFindings.length}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 5px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)'
              }}
            >
              0
            </span>
          )}
        </button>
      </div>

      {/* Discrepancy Insight Banner */}
      {hasDiscrepancy && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            color: '#c7d2fe'
          }}
        >
          <AlertTriangle size={14} color="#818cf8" style={{ flexShrink: 0 }} />
          <span>
            <strong>Multi-View Discrepancy:</strong> Visible text contains 0 threats, but AXTree contains hidden instruction overrides.
          </span>
        </div>
      )}

      {/* Tab View Content Container */}
      <div
        style={{
          flex: 1,
          maxHeight: '270px',
          overflowY: 'auto',
          background: 'rgba(2, 6, 17, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          fontSize: '0.8rem',
          lineHeight: 1.6
        }}
      >
        {/* Visible Text View */}
        {activeTab === 'visible' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Rendered text nodes presented to standard users & single-view agents:
            </div>
            {page.visibleText.map((item, i) => {
              const matchingFinding = findings.find(
                f => f.view === 'visible_text' && item.includes(f.text)
              );

              return (
                <div
                  key={i}
                  className={matchingFinding ? 'attack-spotlight' : ''}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: matchingFinding
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: matchingFinding
                      ? '1px solid #ef4444'
                      : '1px solid rgba(255, 255, 255, 0.03)',
                    color: matchingFinding ? '#fca5a5' : '#cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {matchingFinding && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: '#f87171',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        [FLAGGED VISIBLE INJECTION]
                      </span>
                      <button
                        onClick={() => handleCopy(item)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fca5a5',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.65rem'
                        }}
                      >
                        {copiedText === item ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedText === item ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Raw DOM View with Line Numbers */}
        {activeTab === 'dom' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '8px',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Normalized HTML / DOM representation sent to LLM context:
            </div>
            <div className="code-inspector-container">
              {page.domText.map((item, i) => {
                const isTainted = item.includes('aria-label') || item.includes('attacker');
                return (
                  <div
                    key={i}
                    className={`code-line-row ${isTainted ? 'attack-spotlight' : ''}`}
                    style={{
                      background: isTainted ? 'rgba(239, 68, 68, 0.1)' : undefined
                    }}
                  >
                    <span className="code-line-number">{i + 1}</span>
                    <span
                      className="code-line-content"
                      style={{
                        color: isTainted ? '#fca5a5' : '#94a3b8',
                        fontWeight: isTainted ? 600 : 400
                      }}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AXTree / Accessibility View */}
        {activeTab === 'accessibility' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Extracted Accessibility Tree elements (accessible names, roles, aria-labels):
            </div>

            {page.accessibilityText.length === 0 ? (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  padding: '12px 0',
                  textAlign: 'center'
                }}
              >
                No accessibility attributes extracted on this page.
              </div>
            ) : (
              page.accessibilityText.map((entry, i) => {
                const isMaliciousAria = findings.some(
                  f => f.view === 'accessibility_tree' && f.text.includes(entry.text)
                );

                return (
                  <div
                    key={i}
                    className={isMaliciousAria ? 'attack-spotlight' : ''}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isMaliciousAria
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(16, 185, 129, 0.08)',
                      border: isMaliciousAria
                        ? '1px solid #ef4444'
                        : '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: isMaliciousAria ? '#f87171' : '#34d399'
                          }}
                        >
                          {entry.kind}
                        </span>
                        {entry.selector && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {entry.selector}
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: isMaliciousAria
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(16, 185, 129, 0.2)',
                          color: isMaliciousAria ? '#fecaca' : '#a7f3d0',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isMaliciousAria ? (
                          <>
                            <AlertTriangle size={11} />
                            <span>CRITICAL INJECTION</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={11} />
                            <span>BENIGN ACCESSIBILITY</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        color: isMaliciousAria ? '#fca5a5' : '#e2e8f0',
                        fontWeight: isMaliciousAria ? 600 : 400,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.76rem',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '6px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      "{entry.text}"
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </DoubleBezelCard>
  );
};

export default MultiViewInspector;
