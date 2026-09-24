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
          <Terminal size={16} color="var(--primary)" />
          <span>Multi-View Representation Audit</span>
        </div>
      }
      headerRight={
        <span
          style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: '#f1f5f9',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontWeight: 600
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
          background: '#f1f5f9',
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
            background: activeTab === 'visible' ? '#ffffff' : 'transparent',
            color: activeTab === 'visible' ? '#0f172a' : 'var(--text-secondary)',
            boxShadow: activeTab === 'visible' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Eye size={14} color={activeTab === 'visible' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>Visible</span>
          {visibleFindings.length > 0 ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: '#e11d48',
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
                background: '#e2e8f0',
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
            background: activeTab === 'dom' ? '#ffffff' : 'transparent',
            color: activeTab === 'dom' ? '#0f172a' : 'var(--text-secondary)',
            boxShadow: activeTab === 'dom' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Code size={14} color={activeTab === 'dom' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>Raw DOM</span>
          {domFindings.length > 0 ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: '#d97706',
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
                background: '#e2e8f0',
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
            background: activeTab === 'accessibility' ? '#ffffff' : 'transparent',
            color: activeTab === 'accessibility' ? '#0f172a' : 'var(--text-secondary)',
            boxShadow: activeTab === 'accessibility' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Accessibility size={14} color={activeTab === 'accessibility' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>AXTree / ARIA</span>
          {ariaFindings.length > 0 ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: '#e11d48',
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
                background: '#e2e8f0',
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
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            color: '#4338ca'
          }}
        >
          <AlertTriangle size={15} color="#4f46e5" style={{ flexShrink: 0 }} />
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
          background: '#f8fafc',
          border: '1px solid var(--border-subtle)',
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
                      ? '#fff1f2'
                      : '#ffffff',
                    border: matchingFinding
                      ? '1px solid #fecdd3'
                      : '1px solid var(--border-subtle)',
                    color: matchingFinding ? '#9f1239' : '#1e293b',
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
                          color: '#e11d48',
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
                          color: '#e11d48',
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
                      background: isTainted ? '#fff1f2' : undefined
                    }}
                  >
                    <span className="code-line-number">{i + 1}</span>
                    <span
                      className="code-line-content"
                      style={{
                        color: isTainted ? '#9f1239' : '#334155',
                        fontWeight: isTainted ? 700 : 400
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
                        ? '#fff1f2'
                        : '#ffffff',
                      border: isMaliciousAria
                        ? '1px solid #fecdd3'
                        : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
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
                            color: isMaliciousAria ? '#e11d48' : '#059669'
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
                              background: '#f1f5f9',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)'
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
                            ? '#ffe4e6'
                            : '#ecfdf5',
                          color: isMaliciousAria ? '#9f1239' : '#065f46',
                          border: isMaliciousAria ? '1px solid #fecdd3' : '1px solid #a7f3d0',
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
                        color: isMaliciousAria ? '#9f1239' : '#1e293b',
                        fontWeight: isMaliciousAria ? 600 : 400,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.76rem',
                        background: isMaliciousAria ? '#fff5f5' : '#f8fafc',
                        border: '1px solid var(--border-subtle)',
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
