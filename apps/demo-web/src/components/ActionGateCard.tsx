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
            background: !isHighRisk ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: !isHighRisk ? '#34d399' : '#f87171',
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
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem'
        }}
      >
        <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '3px' }}>
          {proposedAction.label}
        </div>
        <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
          Action Type: <span style={{ color: '#c7d2fe' }}>{proposedAction.type}()</span>
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
            ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' 
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
            background: '#38bdf8',
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
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px dashed rgba(6, 182, 212, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.78rem',
          color: '#38bdf8'
        }}>
          <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#06b6d4' }} />
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
            background: 'rgba(16, 185, 129, 0.1)',
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
                  ? '#34d399'
                  : actionResult.confirmationRequired
                  ? '#c084fc'
                  : '#f87171',
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
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: actionResult.riskScore >= 60 ? '#fca5a5' : '#86efac'
              }}
            >
              Risk: {actionResult.riskScore}/100
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45, margin: 0 }}>
            {actionResult.reason}
          </p>

          {/* Containment Assurance Guarantee */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-muted)'
          }}>
            <span>State Mutation Policy:</span>
            <span style={{ 
              color: actionResult.allowed ? '#34d399' : '#f87171',
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
                background: 'rgba(139, 92, 246, 0.25)',
                border: '1px solid #8b5cf6',
                color: '#e9d5ff',
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
