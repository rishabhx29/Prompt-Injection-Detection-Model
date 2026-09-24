import React, { useState, useEffect } from 'react';
import type { AgentSimulationOutcome } from '../services/agent';
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Terminal, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Code 
} from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';

interface SimulatedAgentTraceProps {
  trace: AgentSimulationOutcome | null;
  isRunning?: boolean;
}

export const SimulatedAgentTrace: React.FC<SimulatedAgentTraceProps> = ({
  trace,
  isRunning = false
}) => {
  // Stepped playback state
  const [activeStepIndex, setActiveStepIndex] = useState<number>(trace ? trace.steps.length - 1 : -1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '2x' | 'instant'>('1x');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // When a new trace arrives, initialize playback
  useEffect(() => {
    if (trace) {
      setActiveStepIndex(0);
      setIsPlaying(true);
      setExpandedStepId(null);
    } else {
      setActiveStepIndex(-1);
      setIsPlaying(false);
      setExpandedStepId(null);
    }
  }, [trace]);

  // Stepped playback timer
  useEffect(() => {
    if (!isPlaying || !trace) return;

    if (playbackSpeed === 'instant') {
      setActiveStepIndex(trace.steps.length - 1);
      setIsPlaying(false);
      return;
    }

    const intervalMs = playbackSpeed === '2x' ? 450 : 900;
    const timer = setInterval(() => {
      setActiveStepIndex(prev => {
        if (prev < trace.steps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, trace, playbackSpeed]);

  const handleTogglePlay = () => {
    if (!trace) return;
    if (activeStepIndex >= trace.steps.length - 1) {
      setActiveStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const handleStepForward = () => {
    if (!trace) return;
    setIsPlaying(false);
    setActiveStepIndex(prev => Math.min(prev + 1, trace.steps.length - 1));
  };

  const handleResetTrace = () => {
    if (!trace) return;
    setIsPlaying(false);
    setActiveStepIndex(0);
    setExpandedStepId(null);
  };

  const handleToggleExpandStep = (stepId: string) => {
    setExpandedStepId(prev => prev === stepId ? null : stepId);
  };

  if (!trace && !isRunning) {
    return (
      <DoubleBezelCard
        headerLeft={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={16} color="var(--accent-cyan)" />
            <span>Simulated LLM Agent Trace</span>
          </div>
        }
        headerRight={
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Status: IDLE
          </span>
        }
      >
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <Bot size={28} style={{ opacity: 0.4 }} />
          <span>Conduct an Action Gate check above to launch the simulated LLM agent trace.</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', opacity: 0.8 }}>
            AgentGuard will evaluate prompt ingestion, deliberation, formulation, and containment in real-time.
          </span>
        </div>
      </DoubleBezelCard>
    );
  }

  const isComplete = trace ? activeStepIndex >= trace.steps.length - 1 : false;
  const isAttackBlocked = trace ? !trace.gateVerdict.allowed : false;

  return (
    <DoubleBezelCard
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={16} color="var(--accent-cyan)" />
          <span style={{ fontWeight: 700 }}>Autonomous Agent Execution Trace</span>
          {trace && (
            <span style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: !isComplete 
                ? 'rgba(2, 132, 199, 0.12)' 
                : (isAttackBlocked ? 'rgba(225, 29, 72, 0.12)' : 'rgba(5, 150, 105, 0.12)'),
              color: !isComplete 
                ? '#0369a1' 
                : (isAttackBlocked ? '#be123c' : '#047857'),
              border: `1px solid ${
                !isComplete 
                  ? 'rgba(2, 132, 199, 0.35)' 
                  : (isAttackBlocked ? 'rgba(225, 29, 72, 0.35)' : 'rgba(5, 150, 105, 0.35)')
              }`
            }}>
              {!isComplete 
                ? `STEP ${activeStepIndex + 1} / 5 EXECUTING` 
                : (isAttackBlocked ? 'EXPLOIT NEUTRALIZED' : 'SAFE EXECUTION COMPLETED')}
            </span>
          )}
        </div>
      }
      headerRight={
        trace ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Speed Selector */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '4px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
              {(['1x', '2x', 'instant'] as const).map(spd => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  style={{
                    background: playbackSpeed === spd ? '#0284c7' : 'transparent',
                    color: playbackSpeed === spd ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title={`Set playback speed to ${spd}`}
                >
                  {spd.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="playback-btn playback-btn-primary"
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'Pause' : (isComplete ? 'Replay' : 'Play')}</span>
            </button>

            {/* Step Forward */}
            <button
              onClick={handleStepForward}
              disabled={isComplete}
              className="playback-btn"
              title="Step forward one phase"
            >
              <SkipForward size={12} />
              <span>Step</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleResetTrace}
              className="playback-btn"
              title="Reset simulation to step 1"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        ) : undefined
      }
      innerStyle={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        padding: '16px'
      }}
    >
      {/* 5-Step Timeline Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px'
      }}>
        {trace?.steps.map((step, idx) => {
          const isCurrentActive = idx === activeStepIndex && isPlaying;
          const isRevealed = idx <= activeStepIndex;
          const isExpanded = expandedStepId === step.id;

          let cardClass = 'step-card';
          let StepIcon = CheckCircle;
          let iconColor = '#059669';

          if (isRevealed) {
            if (step.status === 'blocked') {
              cardClass += ' step-card-blocked';
              StepIcon = XCircle;
              iconColor = '#e11d48';
            } else if (step.status === 'warning') {
              cardClass += ' step-card-warning';
              StepIcon = AlertTriangle;
              iconColor = '#d97706';
            } else if (step.status === 'active') {
              cardClass += ' step-card-active';
              StepIcon = Terminal;
              iconColor = '#0284c7';
            } else {
              cardClass += ' step-card-success';
            }
          }

          if (isCurrentActive) {
            cardClass += ' step-card-active';
          }

          return (
            <div
              key={step.id}
              className={cardClass}
              onClick={() => handleToggleExpandStep(step.id)}
              style={{
                opacity: isRevealed ? 1 : 0.45,
                filter: isRevealed ? 'none' : 'grayscale(60%)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isCurrentActive ? '#0284c7' : 'var(--text-muted)'
                }}>
                  STEP 0{step.stepNumber}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {step.latencyMs && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {step.latencyMs}ms
                    </span>
                  )}
                  {isRevealed && <StepIcon size={14} color={iconColor} />}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {step.title}
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {step.detail}
              </div>

              {/* Toggle telemetry link */}
              {isRevealed && step.telemetry && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Code size={11} color="var(--primary)" />
                    <span>Telemetry Inspector</span>
                  </div>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              )}

              {/* Inline Telemetry Drawer */}
              {isExpanded && step.telemetry && (
                <div className="telemetry-drawer" onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontWeight: 700, fontSize: '0.7rem' }}>
                    <span>STEP 0{step.stepNumber} TELEMETRY</span>
                    <span>TIMESTAMP: {step.timestamp}</span>
                  </div>

                  {step.telemetry.threatSignals && step.telemetry.threatSignals.length > 0 && (
                    <div style={{ color: '#e11d48', fontSize: '0.7rem' }}>
                      <strong>Detected Signals:</strong> {step.telemetry.threatSignals.join(', ')}
                    </div>
                  )}

                  {step.telemetry.rawCodeSnippet && (
                    <pre style={{
                      background: '#f1f5f9',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      color: '#0f172a',
                      margin: 0,
                      overflowX: 'auto'
                    }}>
                      {step.telemetry.rawCodeSnippet}
                    </pre>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    {step.telemetry.inputTokens !== undefined && (
                      <div>Input Tokens: <strong style={{ color: '#0f172a' }}>{step.telemetry.inputTokens}</strong></div>
                    )}
                    {step.telemetry.contextSizeChars !== undefined && (
                      <div>Context Chars: <strong style={{ color: '#0f172a' }}>{step.telemetry.contextSizeChars}</strong></div>
                    )}
                    {step.telemetry.quarantinedSpansCount !== undefined && (
                      <div>Quarantined Spans: <strong style={{ color: '#e11d48' }}>{step.telemetry.quarantinedSpansCount}</strong></div>
                    )}
                    {step.telemetry.riskScore !== undefined && (
                      <div>Risk Score: <strong style={{ color: step.telemetry.riskScore >= 70 ? '#e11d48' : '#059669' }}>{step.telemetry.riskScore}/100</strong></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exploit Containment & Sandbox State Banner */}
      {trace && isComplete && (
        <div className={isAttackBlocked ? 'exploit-barrier-banner' : undefined} style={!isAttackBlocked ? {
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        } : undefined}>
          {isAttackBlocked && <div className="hazard-stripes" />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAttackBlocked ? (
                <ShieldAlert size={22} color="#e11d48" />
              ) : (
                <ShieldCheck size={22} color="#059669" />
              )}
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isAttackBlocked ? '#e11d48' : '#059669',
                  display: 'block'
                }}>
                  {isAttackBlocked 
                    ? 'SECURITY CONTAINMENT BARRIER ACTIVE' 
                    : 'AUTHORIZED ACTION VERIFIED'}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {trace.executionSummary}
                </span>
              </div>
            </div>

            <span style={{
              fontSize: '0.72rem',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              background: isAttackBlocked ? '#fff1f2' : '#ecfdf5',
              color: isAttackBlocked ? '#e11d48' : '#059669',
              border: `1px solid ${isAttackBlocked ? '#fecdd3' : '#a7f3d0'}`
            }}>
              {isAttackBlocked ? 'ZERO MUTATION (0 BYTES MODIFIED)' : 'SANDBOX STATE CLEAN'}
            </span>
          </div>

          {/* Sandbox State Before vs After Diff */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.76rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, display: 'block' }}>
                Initial Sandbox State:
              </span>
              <span style={{ color: '#334155', fontFamily: 'var(--font-mono)' }}>
                {trace.initialSandboxState}
              </span>
            </div>

            <div>
              <span style={{ color: isAttackBlocked ? '#e11d48' : '#0284c7', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, display: 'block' }}>
                {isAttackBlocked ? 'Intercepted Exploit Mutation:' : 'Attempted Action Intent:'}
              </span>
              <span style={{ color: isAttackBlocked ? '#9f1239' : '#0f172a', fontFamily: 'var(--font-mono)' }}>
                {trace.attemptedStateMutation}
              </span>
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
              <span style={{ color: isAttackBlocked ? '#059669' : '#0284c7', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, display: 'block' }}>
                Final Sandbox State:
              </span>
              <span style={{ color: isAttackBlocked ? '#059669' : 'var(--text-primary)', fontWeight: 600 }}>
                {trace.finalSandboxState}
              </span>
            </div>
          </div>
        </div>
      )}
    </DoubleBezelCard>
  );
};

