import React from 'react';
import { useToast } from './ToastContext';
import { CheckCircle, AlertTriangle, ShieldAlert, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((t) => {
        let borderColor = 'var(--border-subtle)';
        let bgColor = 'rgba(10, 15, 29, 0.95)';
        let Icon = Info;
        let iconColor = '#06b6d4';

        if (t.type === 'success') {
          borderColor = 'rgba(16, 185, 129, 0.4)';
          bgColor = 'rgba(6, 25, 20, 0.95)';
          Icon = CheckCircle;
          iconColor = '#34d399';
        } else if (t.type === 'error') {
          borderColor = 'rgba(239, 68, 68, 0.5)';
          bgColor = 'rgba(30, 10, 15, 0.95)';
          Icon = ShieldAlert;
          iconColor = '#f87171';
        } else if (t.type === 'warning') {
          borderColor = 'rgba(245, 158, 11, 0.5)';
          bgColor = 'rgba(30, 20, 10, 0.95)';
          Icon = AlertTriangle;
          iconColor = '#fbbf24';
        }

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              animation: 'fadeIn 0.2s ease-out',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Icon size={18} color={iconColor} style={{ marginTop: '2px', flexShrink: 0 }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
                {t.title}
              </div>
              {t.message && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {t.message}
                </div>
              )}
            </div>

            <button
              onClick={() => dismissToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                flexShrink: 0
              }}
              title="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
