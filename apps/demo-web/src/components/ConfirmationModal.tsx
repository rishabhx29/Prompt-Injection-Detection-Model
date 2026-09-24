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
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
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
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15)',
          border: '1px solid var(--border-subtle)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div className="bezel-card-inner" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
              <AlertTriangle size={20} color="#7c3aed" />
              <span>HUMAN-IN-THE-LOOP AUTHORIZATION REQUIRED</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
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
            CtxVigil action gate intercepted an agent tool invocation that deviates from your original objective or targets sensitive persistent state. Explicit human confirmation is required before execution.
          </p>

          {/* Goal vs Action Comparison */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Target size={12} />
                <span>Original User Intent:</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                "{userTask}"
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <ArrowRight size={14} style={{ opacity: 0.6 }} />
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Intercepted Tool Deviation</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e11d48', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Lock size={12} />
                <span>Proposed Divergent Action:</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#9f1239', fontWeight: 600, marginTop: '2px' }}>
                {proposedAction.label} <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>({proposedAction.type})</span>
              </div>
            </div>

            <div style={{
              marginTop: '4px',
              padding: '8px 10px',
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              borderRadius: '4px',
              fontSize: '0.74rem',
              color: '#6d28d9'
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
                border: '1px solid #fecdd3',
                color: '#e11d48',
                background: '#fff1f2'
              }}
            >
              <ShieldAlert size={15} />
              <span>Deny & Quarantine Action</span>
            </button>

            <button
              onClick={onConfirm}
              className="btn-action"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                padding: '10px 20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(124, 58, 237, 0.25)'
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
