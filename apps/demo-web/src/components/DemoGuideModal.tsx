import React from 'react';
import { Sparkles, Shield, AlertTriangle, CheckCircle, ArrowRight, Play, X, Terminal, Eye, Lock } from 'lucide-react';
import type { FixtureScenario } from '../fixtures/types';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAct: (scenarioId: string, customTask?: string) => void;
  fixtures: FixtureScenario[];
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectAct,
  fixtures: _fixtures
}) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-guide-title"
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.2), 0 0 0 1px #e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, #eef2ff, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h2 id="demo-guide-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Mission Control: 4-Minute Presentation Guide
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Curated 3-Act walkthrough script for faculty evaluation & live security demonstrations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close presentation guide"
            style={{
              background: '#f1f5f9',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Executive Overview Banner */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)'
          }}>
            <Shield size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#0f172a' }}>Demonstration Objective:</strong> Prove how CtxVigil prevents
              indirect prompt injection attacks against autonomous browser agents by cross-referencing visual, DOM, and accessibility representations, backed by an immutable runtime Action Gate.
            </div>
          </div>

          {/* 3 Acts Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ACT 1 */}
            <div style={{
              padding: '18px 20px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0'
                  }}>
                    ACT 1 · 45 SEC
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Safe Baseline Control
                  </h3>
                </div>
                <button
                  onClick={() => {
                    onSelectAct('safe-refund-page');
                    onClose();
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px' }}
                >
                  <Play size={13} fill="#4f46e5" color="#4f46e5" />
                  <span>Launch Act 1</span>
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#0f172a' }}>Speaking Script:</strong> &ldquo;First, let&apos;s establish our ground truth baseline. The agent is assigned a legitimate e-commerce return. We run a security scan—all three views are clean, risk score is 10/100, and the action gate safely authorizes the browser agent to proceed.&rdquo;
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                paddingTop: '6px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} color="#059669" />
                  <span>Expected Score: <strong>10 / 100</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#059669" />
                  <span>Verdict: <strong>ALLOW</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowRight size={14} color="#0284c7" />
                  <span>Action: <strong>Permitted (Legitimate)</strong></span>
                </div>
              </div>
            </div>

            {/* ACT 2 - STAR DEMO */}
            <div style={{
              padding: '18px 20px',
              borderRadius: '12px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              boxShadow: '0 2px 8px rgba(225, 29, 72, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#ffe4e6',
                    color: '#e11d48',
                    border: '1px solid #fecdd3'
                  }}>
                    ACT 2 · STAR DEMO · 2 MIN
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#9f1239' }}>
                    Concealed ARIA Prompt Injection Exploit
                  </h3>
                </div>
                <button
                  onClick={() => {
                    onSelectAct('aria-injection');
                    onClose();
                  }}
                  className="btn-action"
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 14px',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #e11d48, #be123c)'
                  }}
                >
                  <Play size={13} fill="#ffffff" color="#ffffff" />
                  <span>Launch Star Demo</span>
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                <strong style={{ color: '#0f172a' }}>Speaking Script:</strong> &ldquo;Now observe this malicious attack. In the Webpage Preview, the page looks completely harmless—just a standard customer satisfaction poll. A human or visual model sees nothing wrong. But when we toggle to the <em>Accessibility Tree Inspector</em>, CtxVigil uncovers a hidden malicious instruction disguised inside an aria-label directing the agent to exfiltrate credentials. When the agent attempts to execute <code>change_account_email</code>, our runtime Action Gate intervenes, activating the Containment Barrier and maintaining absolute zero state mutation.&rdquo;
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                paddingTop: '6px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#e11d48" />
                  <span>Expected Score: <strong>89 / 100</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} color="#e11d48" />
                  <span>Verdict: <strong>BLOCK (Discrepancy)</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#e11d48" />
                  <span>Containment: <strong>ACTIVE (Zero Mutation)</strong></span>
                </div>
              </div>
            </div>

            {/* ACT 3 */}
            <div style={{
              padding: '18px 20px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#f0f9ff',
                    color: '#0284c7',
                    border: '1px solid #bae6fd'
                  }}>
                    ACT 3 · CONTROL · 1 MIN
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Benign ARIA Hard Negative Control
                  </h3>
                </div>
                <button
                  onClick={() => {
                    onSelectAct('benign-aria-negative');
                    onClose();
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px' }}
                >
                  <Play size={13} fill="#0284c7" color="#0284c7" />
                  <span>Launch Act 3</span>
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#0f172a' }}>Speaking Script:</strong> &ldquo;Finally, we demonstrate system precision. Naive keyword filters flag any imperative phrase like &apos;Click here to submit&apos; as an injection attempt, causing high false alarm rates. CtxVigil reconciles the visual button text against the accessibility tree, verifies semantic coherence, and grants permission without false positives.&rdquo;
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                paddingTop: '6px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} color="#0284c7" />
                  <span>Expected Score: <strong>14 / 100</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#0284c7" />
                  <span>Verdict: <strong>ALLOW (No False Alarm)</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="#0284c7" />
                  <span>Reconciliation: <strong>Cross-View Verified</strong></span>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Shortcuts & Presentation Controls Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Terminal size={14} color="#475569" />
              <span>Global Shortcuts:</span>
              <kbd className="kbd-shortcut-hint">Ctrl + ↵</kbd> Scan Page
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd className="kbd-shortcut-hint">Shift + ↵</kbd> Test Action
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd className="kbd-shortcut-hint">1 - 6</kbd> Switch Scenarios
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd className="kbd-shortcut-hint">Esc</kbd> Close Modal
            </div>
            <button
              onClick={onClose}
              className="btn-action"
              style={{ fontSize: '0.8rem', padding: '6px 16px' }}
            >
              Close Guide
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DemoGuideModal;
