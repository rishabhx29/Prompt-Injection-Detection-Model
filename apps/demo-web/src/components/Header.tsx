import React, { useState } from 'react';
import { Shield, Wifi, Server, RefreshCw, Settings, Sparkles } from 'lucide-react';
import type { HealthStatus } from '../services/protection';
import { ApiConfigModal } from './ApiConfigModal';

interface HeaderProps {
  mode: 'mock' | 'live';
  onToggleMode: () => void;
  health: HealthStatus;
  onReset: () => void;
  isScanning: boolean;
  onEndpointUpdated?: (newUrl: string) => void;
  onOpenDemoGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onToggleMode,
  health,
  onReset,
  isScanning,
  onEndpointUpdated,
  onOpenDemoGuide
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  const handleEndpointUpdated = (newUrl: string) => {
    if (onEndpointUpdated) {
      onEndpointUpdated(newUrl);
    }
  };

  return (
    <>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(6, 9, 17, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Brand & Team Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                CtxVigil
              </h1>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                DA-1 AI ENGINE v1.0
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Multi-View Prompt-Injection Defense · Rishabh Tripathi (24BRS1136) & Saumya (24BRS1065) · BCSE306L AI
            </p>
          </div>
        </div>

        {/* Controls & Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Backend / Mock Status Indicator with Telemetry */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem'
          }}>
            <span className={`pulsing-dot ${health.online ? 'online' : 'offline'}`} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {mode === 'mock' ? 'Mock Engine (Standalone)' : 'Live CtxVigil API (:8787)'}
            </span>
            {health.latencyMs !== undefined && (
              <span style={{ 
                color: health.latencyMs < 50 ? '#34d399' : (health.latencyMs < 200 ? '#f59e0b' : '#f87171'), 
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600
              }}>
                {health.latencyMs}ms
              </span>
            )}
            {mode === 'live' && (
              <button
                onClick={() => setIsConfigOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Configure Live Protection API Endpoint"
              >
                <Settings size={13} />
              </button>
            )}
          </div>

          {/* Mode Toggle Switcher */}
          <button
            onClick={onToggleMode}
            className="btn-secondary"
            title={mode === 'mock' ? 'Switch to Live API Mode' : 'Switch to Offline Mock Mode'}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            {mode === 'mock' ? (
              <>
                <Server size={14} />
                <span>Source: <strong>Mock Fixtures</strong></span>
              </>
            ) : (
              <>
                <Wifi size={14} />
                <span>Source: <strong>Live API</strong></span>
              </>
            )}
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={onReset}
            disabled={isScanning}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            title="Reset current scenario to initial state"
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            <span>Reset Demo</span>
          </button>

          {/* Demo Guide Presentation Button */}
          {onOpenDemoGuide && (
            <button
              onClick={onOpenDemoGuide}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#c7d2fe',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)'
              }}
              title="Open 4-Minute Presentation Guide (Curated Evaluator Walkthrough)"
            >
              <Sparkles size={14} color="#818cf8" />
              <span>★ Demo Guide</span>
            </button>
          )}
        </div>
      </header>

      {/* API Endpoint Configuration Modal */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onEndpointUpdated={handleEndpointUpdated}
      />
    </>
  );
};
