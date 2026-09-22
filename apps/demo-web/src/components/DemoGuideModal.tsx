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
        backgroundColor: 'rgba(6, 9, 17, 0.85)',
        backdropFilter: 'blur(10px)',
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
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
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
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h2 id="demo-guide-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
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
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
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
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)'
          }}>
            <Shield size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#ffffff' }}>Demonstration Objective:</strong> Prove how CtxVigil prevents
              indirect prompt injection attacks against autonomous browser agents by cross-referencing visual, DOM, and accessibility representations, backed by an immutable runtime Action Gate.
            </div>
          </div>

          {/* 3 Acts Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ACT 1 */}
            <div style={{
              padding: '18px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'border-color 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    ACT 1 · 45 SEC
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
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
                  <Play size={13} fill="#818cf8" color="#818cf8" />
                  <span>Launch Act 1</span>
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#e2e8f0' }}>Speaking Script:</strong> &ldquo;First, let&apos;s establish our ground truth baseline. The agent is assigned a legitimate e-commerce return. We run a security scan—all three views are clean, risk score is 0/100, and the action gate safely authorizes the browser agent to proceed.&rdquo;
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                paddingTop: '6px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} color="#34d399" />
                  <span>Expected Score: <strong>0 / 100</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#34d399" />
                  <span>Verdict: <strong>ALLOW</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowRight size={14} color="#38bdf8" />
                  <span>Action: <strong>Permitted (Legitimate)</strong></span>
                </div>
              </div>
            </div>

            {/* ACT 2 - STAR DEMO */}
            <div style={{
              padding: '18px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.08)',
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
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)'
                  }}>
                    ACT 2 · STAR DEMO · 2 MIN
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    Concealed ARIA Prompt Injection Exploit
                  </h3>
                </div>
                <button
                  onClick={() => {
                    onSelectAct('aria-injection');
                    onClose();
                  }}
                  className="btn-primary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 14px',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <Play size={13} fill="#ffffff" color="#ffffff" />
                  <span>Launch Star Demo</span>
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#e2e8f0' }}>Speaking Script:</strong> &ldquo;Now observe this malicious attack. In the Webpage Preview, the page looks completely harmless—just a standard customer satisfaction poll. A human or visual model sees nothing wrong. But when we toggle to the <em>Accessibility Tree Inspector</em>, CtxVigil uncovers a hidden malicious instruction disguised inside an aria-label directing the agent to exfiltrate credentials. When the agent attempts to execute <code>change_account_email</code>, our runtime Action Gate intervenes, activating the Containment Barrier and maintaining absolute zero state mutation.&rdquo;
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                paddingTop: '6px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#f87171" />
                  <span>Expected Score: <strong>92 / 100</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} color="#f87171" />
                  <span>Verdict: <strong>BLOCK (Discrepancy)</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#f87171" />
                  <span>Containment: <strong>ACTIVE (Zero Mutation)</strong></span>
                </div>
              </div>
            </div>

            {/* ACT 3 */}
            <div style={{
              padding: '18px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
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
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    ACT 3 · CONTROL · 1 MIN
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
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
                  <Play size={13} fill="#38bdf8" color="#38bdf8" />
                  <span>Launch Act 3</span>
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#e2e8f0' }}>Speaking Script:</strong> &ldquo;Finally, we demonstrate system precision. Naive keyword filters flag any imperative phrase like &apos;Click here to submit&apos; as an injection attempt, causing high false alarm rates. CtxVigil reconciles the visual button text against the accessibility tree, verifies semantic coherence, and grants permission without false positives.&rdquo;
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                paddingTop: '6px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} color="#38bdf8" />
                  <span>Expected Score: <strong>12 / 100</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#38bdf8" />
                  <span>Verdict: <strong>ALLOW (No False Alarm)</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="#38bdf8" />
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
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Terminal size={14} color="#94a3b8" />
              <span>Global Shortcuts:</span>
              <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.72rem' }}>Ctrl + ↵</kbd> Scan Page
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.72rem' }}>Shift + ↵</kbd> Test Action
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.72rem' }}>1 - 5</kbd> Switch Scenarios
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.72rem' }}>Esc</kbd> Close Modal
            </div>
            <button
              onClick={onClose}
              className="btn-primary"
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
