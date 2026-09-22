import React, { useState } from 'react';
import { Settings, Wifi, Check, X, RefreshCw, Globe, AlertCircle } from 'lucide-react';
import { getHttpProtectionService, DEFAULT_PROTECTION_API_URL } from '../services/protection';
import type { HealthStatus } from '../services/protection';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEndpointUpdated: (newUrl: string) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onEndpointUpdated
}) => {
  const httpService = getHttpProtectionService();
  const [urlInput, setUrlInput] = useState<string>(httpService.getBaseUrl());
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<HealthStatus | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl?: string) => {
    const urlToTest = targetUrl || urlInput;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await httpService.checkHealth(urlToTest);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        online: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const cleaned = urlInput.trim().replace(/\/+$/, '');
    if (!cleaned) return;
    httpService.setBaseUrl(cleaned);
    onEndpointUpdated(cleaned);
    onClose();
  };

  const handleSelectPreset = (preset: string) => {
    setUrlInput(preset);
    void handleTestConnection(preset);
  };

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
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.25)',
          border: '1px solid rgba(6, 182, 212, 0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div className="bezel-card-inner" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
              <Settings size={18} color="#38bdf8" />
              <span>AGENTGUARD LIVE API CONFIGURATION</span>
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
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            Configure the network endpoint for Rishabh's AgentGuard Protection HTTP Adapter. The dashboard connects here for real-time multi-view scanning and action gating.
          </p>

          {/* Endpoint Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Protection API Base URL:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px'
              }}>
                <Globe size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://localhost:3000"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    width: '100%'
                  }}
                />
              </div>

              <button
                onClick={() => handleTestConnection()}
                disabled={testing}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Ping /health endpoint"
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? 'Testing...' : 'Test Ping'}</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Default (:3000)', url: DEFAULT_PROTECTION_API_URL },
                { label: 'IPv4 Loopback', url: 'http://127.0.0.1:3000' },
                { label: 'Port 8000', url: 'http://localhost:8000' }
              ].map((p) => (
                <button
                  key={p.url}
                  onClick={() => handleSelectPreset(p.url)}
                  style={{
                    background: urlInput === p.url ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${urlInput === p.url ? 'rgba(6, 182, 212, 0.5)' : 'var(--border-subtle)'}`,
                    color: urlInput === p.url ? '#38bdf8' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Result Indicator */}
          {testResult && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: testResult.online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${testResult.online ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {testResult.online ? (
                  <Wifi size={16} color="#34d399" />
                ) : (
                  <AlertCircle size={16} color="#f87171" />
                )}
                <div>
                  <div style={{ fontWeight: 700, color: testResult.online ? '#34d399' : '#f87171' }}>
                    {testResult.online ? 'API IS ONLINE & RESPONSIVE' : 'CONNECTION FAILED'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {testResult.message}
                  </div>
                </div>
              </div>

              {testResult.latencyMs !== undefined && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: testResult.latencyMs < 50 ? '#34d399' : '#f59e0b',
                  fontWeight: 700
                }}>
                  {testResult.latencyMs}ms
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="btn-action"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                padding: '8px 18px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>Save & Apply Endpoint</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigModal;
