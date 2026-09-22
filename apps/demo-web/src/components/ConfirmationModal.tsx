import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, X, Target, ArrowRight, Lock } from 'lucide-react';
import type { CheckActionResponse, ProposedAction } from '../types/agentguard-contract';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposedAction: ProposedAction;
  actionResult: CheckActionResponse | null;
  onConfirm: () => void;
  userTask?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  proposedAction,
  actionResult,
  onConfirm,
  userTask = 'Display user profile information'
}) => {
  if (!isOpen || !actionResult) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div 
        className="bezel-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.25)',
          border: '1px solid rgba(139, 92, 246, 0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div className="bezel-card-inner" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
              <AlertTriangle size={20} color="#c084fc" />
              <span>HUMAN-IN-THE-LOOP AUTHORIZATION REQUIRED</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex'
              }}
              title="Close and reject action"
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            AgentGuard action gate intercepted an agent tool invocation that deviates from your original objective or targets sensitive persistent state. Explicit human confirmation is required before execution.
          </p>

          {/* Goal vs Action Comparison */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Target size={12} />
                <span>Original User Intent:</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                "{userTask}"
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intercepted Tool Deviation</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Lock size={12} />
                <span>Proposed Divergent Action:</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 600, marginTop: '2px' }}>
                {proposedAction.label} <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>({proposedAction.type})</span>
              </div>
            </div>

            <div style={{
              marginTop: '4px',
              padding: '8px 10px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '4px',
              fontSize: '0.74rem',
              color: '#d8b4fe'
            }}>
              <strong>Security Reason:</strong> {actionResult.reason}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5'
              }}
            >
              <ShieldAlert size={15} />
              <span>Deny & Quarantine Action</span>
            </button>

            <button
              onClick={onConfirm}
              className="btn-action"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                padding: '10px 20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
              }}
            >
              <ShieldCheck size={16} />
              <span>Authorize One-Time Override</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

