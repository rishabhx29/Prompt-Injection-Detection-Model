import React from 'react';
import type { ProposedAction, CheckActionResponse } from '../types/agentguard-contract';
import { ShieldAlert, ShieldCheck, PlayCircle, AlertTriangle, Shield } from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';

interface ActionGateCardProps {
  proposedAction: ProposedAction;
  actionResult: CheckActionResponse | null;
  onCheckAction: () => void;
  isChecking: boolean;
  canCheck: boolean;
  onOpenConfirmModal?: () => void;
}

export const ActionGateCard: React.FC<ActionGateCardProps> = ({
  proposedAction,
  actionResult,
  onCheckAction,
  isChecking,
  canCheck,
  onOpenConfirmModal
}) => {
  const isHighRisk = proposedAction.riskCategory !== 'general';

  return (
    <DoubleBezelCard
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--accent-cyan)" />
          <span>Proposed Agent Action</span>
        </div>
      }
      headerRight={
        <span
          style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '4px',
            background: !isHighRisk ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: !isHighRisk ? '#047857' : '#be123c',
            border: `1px solid ${!isHighRisk ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          {proposedAction.riskCategory}
        </span>
      }
      innerStyle={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem'
        }}
      >
        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>
          {proposedAction.label}
        </div>
        <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          Action Type: <span style={{ color: '#4f46e5', fontWeight: 600 }}>{proposedAction.type}()</span>
        </div>
      </div>

      {/* Button to run Action Gate */}
      <button
        onClick={onCheckAction}
        disabled={!canCheck || isChecking}
        className="btn-action"
        style={{
          width: '100%',
          padding: '11px',
          fontSize: '0.88rem',
          background: canCheck 
            ? 'linear-gradient(135deg, #0284c7, #4f46e5)' 
            : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <PlayCircle size={16} />
        <span>{isChecking ? 'Evaluating Action Alignment...' : 'Simulate & Gate Agent Action'}</span>
        {canCheck && !isChecking && (
          <kbd className="kbd-shortcut-hint" style={{ marginLeft: 'auto' }}>Shift + ↵</kbd>
        )}
        {isChecking && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: '#0284c7',
            animation: 'radar-sweep 1.2s infinite ease-in-out'
          }} />
        )}
      </button>

      {!canCheck && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          (Requires page scan verdict before execution check)
        </span>
      )}

      {/* Checking In-Progress Scanner HUD */}
      {isChecking && (
        <div style={{
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          background: '#f0f9ff',
          border: '1px dashed #bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.78rem',
          color: '#0284c7'
        }}>
          <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#0284c7' }} />
          <span>Intercepting agent action intent... Cross-checking with original user goal.</span>
        </div>
      )}

      {/* Action Check Outcome Banner */}
      {actionResult && !isChecking && (
        <div
          className={!actionResult.allowed ? 'exploit-barrier-banner' : undefined}
          style={actionResult.allowed ? {
            marginTop: '4px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: '#ecfdf5',
            border: '1px solid #10b981',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          } : {
            marginTop: '4px'
          }}
        >
          {!actionResult.allowed && <div className="hazard-stripes" />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.82rem',
                color: actionResult.allowed
                  ? '#059669'
                  : actionResult.confirmationRequired
                  ? '#7c3aed'
                  : '#e11d48',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.04em'
              }}
            >
              {actionResult.allowed ? (
                <ShieldCheck size={18} />
              ) : actionResult.confirmationRequired ? (
                <AlertTriangle size={18} />
              ) : (
                <ShieldAlert size={18} />
              )}
              <span>
                {actionResult.allowed 
                  ? 'ACTION PERMITTED' 
                  : (actionResult.confirmationRequired 
                      ? 'CONFIRMATION REQUIRED' 
                      : 'EXPLOIT INTERCEPTED & BLOCKED')}
              </span>
            </span>

            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#f1f5f9',
                border: '1px solid var(--border-subtle)',
                color: actionResult.riskScore >= 60 ? '#e11d48' : '#059669',
                fontWeight: 700
              }}
            >
              Risk: {actionResult.riskScore}/100
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#1e293b', lineHeight: 1.45, margin: 0 }}>
            {actionResult.reason}
          </p>

          {/* Containment Assurance Guarantee */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            paddingTop: '6px',
            borderTop: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)'
          }}>
            <span>State Mutation Policy:</span>
            <span style={{ 
              color: actionResult.allowed ? '#059669' : '#e11d48',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}>
              {actionResult.allowed ? 'AUTHORIZED EXECUTION' : 'ZERO STATE MUTATION (CONTAINED)'}
            </span>
          </div>

          {actionResult.confirmationRequired && onOpenConfirmModal && (
            <button
              onClick={onOpenConfirmModal}
              style={{
                marginTop: '4px',
                background: '#f5f3ff',
                border: '1px solid #7c3aed',
                color: '#7c3aed',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <AlertTriangle size={14} />
              <span>Review Authorization Request (Human Override)</span>
            </button>
          )}
        </div>
      )}
    </DoubleBezelCard>
  );
};

export default ActionGateCard;
