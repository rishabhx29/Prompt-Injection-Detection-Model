import React, { useEffect, useState } from 'react';
import type { ScanPageResponse, Decision } from '../types/agentguard-contract';
import { ShieldCheck, ShieldAlert, AlertTriangle, Play, RefreshCw, CheckCircle2, XCircle, Shield, AlertOctagon } from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';
import { SkeletonLoader } from './common/SkeletonLoader';

interface VerdictPanelProps {
  scanResult: ScanPageResponse | null;
  isScanning: boolean;
  onScan: () => void;
  hasScanRun: boolean;
}

export const VerdictPanel: React.FC<VerdictPanelProps> = ({
  scanResult,
  isScanning,
  onScan,
  hasScanRun
}) => {
  const targetScore = scanResult ? scanResult.riskScore : 0;
  const [animatedScore, setAnimatedScore] = useState<number>(0);

  // Smooth numeric counter roll-up
  useEffect(() => {
    if (!hasScanRun || !scanResult) {
      setAnimatedScore(0);
      return;
    }

    let start = 0;
    const duration = 750; // ms
    const startTime = performance.now();

    const updateScore = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (targetScore - start) * easeOut);
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    };

    requestAnimationFrame(updateScore);
  }, [hasScanRun, targetScore, scanResult]);

  const decision: Decision = scanResult ? scanResult.decision : 'allow';

  // SVG Gauge calculations
  const radius = 56;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = hasScanRun ? animatedScore / 100 : 0;
  const strokeOffset = circumference - scorePercent * circumference;

  // Determine colors and badges based on decision & score
  let gaugeColor = '#059669'; // green (allow)
  let badgeClass = 'badge-allow';
  let decisionTitle = 'SAFE TO PROCEED';
  let DecisionIcon = ShieldCheck;
  let glowColor = 'rgba(5, 150, 105, 0.25)';

  if (decision === 'sanitize') {
    gaugeColor = '#d97706';
    badgeClass = 'badge-sanitize';
    decisionTitle = 'CONTENT SANITIZED';
    DecisionIcon = AlertTriangle;
    glowColor = 'rgba(217, 119, 6, 0.25)';
  } else if (decision === 'confirm') {
    gaugeColor = '#7c3aed';
    badgeClass = 'badge-confirm';
    decisionTitle = 'CONFIRMATION REQUIRED';
    DecisionIcon = AlertOctagon;
    glowColor = 'rgba(124, 58, 237, 0.25)';
  } else if (decision === 'block') {
    gaugeColor = '#e11d48';
    badgeClass = 'badge-block';
    decisionTitle = 'ATTACK BLOCKED';
    DecisionIcon = ShieldAlert;
    glowColor = 'rgba(225, 29, 72, 0.35)';
  }

  // Generate 48 tick marks around circumference
  const tickCount = 48;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const angle = (i / tickCount) * 360;
    const isLit = hasScanRun && (i / tickCount) <= (animatedScore / 100);
    return { angle, isLit };
  });

  return (
    <DoubleBezelCard
      glowColor={hasScanRun ? glowColor : undefined}
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--primary)" />
          <span>Protection Engine Verdict</span>
        </div>
      }
      headerRight={
        hasScanRun && scanResult ? (
          <span className={`badge ${badgeClass}`}>
            {scanResult.riskLevel} risk
          </span>
        ) : undefined
      }
      innerStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic ambient backdrop glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          height: '140px',
          background: hasScanRun ? gaugeColor : 'rgba(79, 70, 229, 0.08)',
          filter: 'blur(55px)',
          opacity: hasScanRun ? 0.16 : 0.06,
          transition: 'all 0.5s ease',
          pointerEvents: 'none'
        }}
      />

      {/* Scan Trigger Button with Micro-Haptics */}
      <button
        onClick={onScan}
        disabled={isScanning}
        className="btn-action"
        style={{
          width: '100%',
          padding: '13px 20px',
          fontSize: '0.96rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        {isScanning ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            <span>Scanning Multi-View Representations...</span>
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            <span>{hasScanRun ? 'Re-Scan Page' : 'Run AgentGuard Scan'}</span>
            <kbd className="kbd-shortcut-hint" style={{ marginLeft: 'auto' }}>Ctrl + ↵</kbd>
          </>
        )}
      </button>

      {/* Scanning Shimmer Skeleton or Tactical SVG Gauge */}
      {isScanning ? (
        <div style={{ width: '100%', padding: '10px 0' }}>
          <SkeletonLoader type="gauge" />
        </div>
      ) : (
        <>
          {/* Concentric Tactical SVG Radial Gauge */}
          <div style={{ position: 'relative', width: '150px', height: '150px', margin: '4px 0' }}>
            <svg
              width="150"
              height="150"
              viewBox="0 0 150 150"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Outer tick ring */}
              {ticks.map((t, idx) => {
                const rad = (t.angle * Math.PI) / 180;
                const r1 = 70;
                const r2 = 66;
                const x1 = 75 + r1 * Math.cos(rad);
                const y1 = 75 + r1 * Math.sin(rad);
                const x2 = 75 + r2 * Math.cos(rad);
                const y2 = 75 + r2 * Math.sin(rad);
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={t.isLit ? gaugeColor : '#e2e8f0'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    style={{ transition: 'stroke 0.3s ease' }}
                  />
                );
              })}

              {/* Background Track */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />

              {/* Concentric Inner Progress Arc */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke={hasScanRun ? gaugeColor : '#cbd5e1'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                  filter: hasScanRun ? `drop-shadow(0 0 4px ${gaugeColor}40)` : 'none'
                }}
              />
            </svg>

            {/* Center HUD Digital Readout */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                  color: hasScanRun ? gaugeColor : 'var(--text-primary)',
                  transition: 'color 0.3s ease'
                }}
              >
                {hasScanRun ? animatedScore : '--'}
              </span>
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                  fontWeight: 700
                }}
              >
                Risk Score
              </span>
            </div>
          </div>

          {/* Decision Status Pill & Attack Intelligence */}
          {hasScanRun && scanResult ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                width: '100%'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  background: `rgba(${
                    decision === 'allow'
                      ? '5, 150, 105'
                      : decision === 'block'
                      ? '225, 29, 72'
                      : decision === 'confirm'
                      ? '124, 58, 237'
                      : '217, 119, 6'
                  }, 0.1)`,
                  border: `1px solid ${gaugeColor}50`,
                  color: gaugeColor,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  letterSpacing: '0.04em',
                  boxShadow: `0 1px 4px ${glowColor}`
                }}
              >
                <DecisionIcon size={18} />
                <span>
                  {decisionTitle} ({scanResult.decision.toUpperCase()})
                </span>
              </div>

              {/* Plain-English Intelligence Summary */}
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  margin: '4px 0 0 0',
                  textAlign: 'center'
                }}
              >
                {scanResult.summary}
              </p>

              {/* Quick Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  width: '100%',
                  marginTop: '6px'
                }}
              >
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Safe Segments
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{scanResult.safeContent.length} segments</span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Blocked Vectors
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color:
                        scanResult.blockedContent.length > 0 ? '#e11d48' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px'
                    }}
                  >
                    <XCircle size={13} />
                    <span>{scanResult.blockedContent.length} isolated</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                padding: '12px 10px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                width: '100%'
              }}
            >
              Click <strong>Run AgentGuard Scan</strong> to inspect page representations through the multi-view defense layer.
            </div>
          )}
        </>
      )}
    </DoubleBezelCard>
  );
};

export default VerdictPanel;
