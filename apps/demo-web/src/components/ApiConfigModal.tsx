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
      background: 'rgba(15, 23, 42, 0.4)',
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
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15), 0 0 0 1px #e2e8f0',
          border: '1px solid var(--border-subtle)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div className="bezel-card-inner" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
              <Settings size={18} color="#4f46e5" />
              <span>AGENTGUARD LIVE API CONFIGURATION</span>
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
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            Configure the network endpoint for the CtxVigil Protection HTTP Adapter. The dashboard connects here for real-time multi-view scanning and action gating.
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
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
              }}>
                <Globe size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://localhost:8787"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#0f172a',
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
                { label: 'Default (:8787)', url: DEFAULT_PROTECTION_API_URL },
                { label: 'IPv4 Loopback', url: 'http://127.0.0.1:8787' },
                { label: 'Port 3000', url: 'http://localhost:3000' }
              ].map((p) => (
                <button
                  key={p.url}
                  onClick={() => handleSelectPreset(p.url)}
                  style={{
                    background: urlInput === p.url ? '#eef2ff' : '#f8fafc',
                    border: `1px solid ${urlInput === p.url ? '#c7d2fe' : 'var(--border-subtle)'}`,
                    color: urlInput === p.url ? '#4f46e5' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
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
              background: testResult.online ? '#ecfdf5' : '#fff1f2',
              border: `1px solid ${testResult.online ? '#a7f3d0' : '#fecdd3'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {testResult.online ? (
                  <Wifi size={16} color="#059669" />
                ) : (
                  <AlertCircle size={16} color="#e11d48" />
                )}
                <div>
                  <div style={{ fontWeight: 700, color: testResult.online ? '#059669' : '#e11d48' }}>
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
                  color: testResult.latencyMs < 50 ? '#059669' : '#d97706',
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
