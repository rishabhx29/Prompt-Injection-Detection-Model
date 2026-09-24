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
        top: '76px',
        right: '24px',
        zIndex: 90,
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
        let bgColor = '#ffffff';
        let Icon = Info;
        let iconColor = '#0284c7';
        let badgeBg = '#f0f9ff';

        if (t.type === 'success') {
          borderColor = '#a7f3d0';
          bgColor = '#ffffff';
          Icon = CheckCircle;
          iconColor = '#059669';
          badgeBg = '#ecfdf5';
        } else if (t.type === 'error') {
          borderColor = '#fecdd3';
          bgColor = '#ffffff';
          Icon = ShieldAlert;
          iconColor = '#e11d48';
          badgeBg = '#fff1f2';
        } else if (t.type === 'warning') {
          borderColor = '#fde68a';
          bgColor = '#ffffff';
          Icon = AlertTriangle;
          iconColor = '#d97706';
          badgeBg = '#fffbeb';
        }

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.2s ease-out',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: badgeBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon size={16} color={iconColor} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {t.title}
              </div>
              {t.message && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
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
