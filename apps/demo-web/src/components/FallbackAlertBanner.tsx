import React from 'react';
import { Server, RefreshCw, Settings, ShieldAlert } from 'lucide-react';

interface FallbackAlertBannerProps {
  apiUrl: string;
  onSwitchToMock: () => void;
  onRetryConnection: () => void;
  onOpenConfig: () => void;
  isRetrying?: boolean;
}

export const FallbackAlertBanner: React.FC<FallbackAlertBannerProps> = ({
  apiUrl,
  onSwitchToMock,
  onRetryConnection,
  onOpenConfig,
  isRetrying = false
}) => {
  return (
    <div
      style={{
        margin: '0 24px 16px 24px',
        padding: '14px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08))',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '750px' }}>
        <div style={{
          padding: '6px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          display: 'flex'
        }}>
          <ShieldAlert size={20} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#fca5a5',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Protection Scan Unavailable · Live API Offline
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.4)',
              color: '#cbd5e1'
            }}>
              {apiUrl}
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#e2e8f0', margin: 0, lineHeight: 1.45 }}>
            Cannot connect to AgentGuard HTTP adapter. Per Rule 4.4, unscanned pages are <strong>never assumed safe</strong>. You can run Rishabh's API locally, test the connection, or switch to offline mock fixtures.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onRetryConnection}
          disabled={isRetrying}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          title="Retry pinging the API endpoint"
        >
          <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
          <span>{isRetrying ? 'Checking...' : 'Retry'}</span>
        </button>

        <button
          onClick={onOpenConfig}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          title="Change API endpoint URL"
        >
          <Settings size={12} />
          <span>Endpoint</span>
        </button>

        <button
          onClick={onSwitchToMock}
          className="btn-action"
          style={{
            padding: '7px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          title="Switch to standalone offline mock fixtures"
        >
          <Server size={13} />
          <span>Switch to Mock Fixtures</span>
        </button>
      </div>
    </div>
  );
};

export default FallbackAlertBanner;
