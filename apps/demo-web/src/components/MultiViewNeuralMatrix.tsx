import React from 'react';
import { 
  Network, 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';
import type { FixtureScenario } from '../fixtures/types';

interface MultiViewNeuralMatrixProps {
  fixture: FixtureScenario;
  hasScanRun: boolean;
}

export const MultiViewNeuralMatrix: React.FC<MultiViewNeuralMatrixProps> = ({
  fixture,
  hasScanRun
}) => {
  const metrics = fixture.multiViewNeuralMetrics;

  if (!metrics) {
    return null;
  }

  const {
    debertaInjectionProb,
    uncertaintyScore,
    views,
    pairwiseCosineAgreements,
    agreementMatrix,
    actionGateDecision,
    gateRationale
  } = metrics;

  // S13 is the critical invariant: Does proposed tool call align with authorized task?
  const s13 = pairwiseCosineAgreements.s13_task_action;
  const isS13Discrepancy = s13 < 0.40;

  // Decision styling
  const isBlock = actionGateDecision === 'BLOCK';
  const isAllow = actionGateDecision === 'ALLOW';
  const gateColor = isBlock ? '#ef4444' : isAllow ? '#10b981' : '#f59e0b';
  const gateBg = isBlock 
    ? 'rgba(239, 68, 68, 0.12)' 
    : isAllow 
    ? 'rgba(16, 185, 129, 0.12)' 
    : 'rgba(245, 158, 11, 0.12)';

  const getHeatmapColor = (val: number) => {
    if (val >= 0.70) return { bg: 'rgba(16, 185, 129, 0.25)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' };
    if (val >= 0.40) return { bg: 'rgba(245, 158, 11, 0.25)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
    return { bg: 'rgba(239, 68, 68, 0.25)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
  };

  const viewHeaders = ['V1: Task', 'V2: System', 'V3: Action', 'V4: Context'];

  return (
    <DoubleBezelCard
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BrainCircuit size={16} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                CtxVigil Multi-View Neural Fusion & Uncertainty Network
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#a78bfa',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                DA-1 §4.1 ARCHITECTURE
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              PyTorch Dual-Head MLP · all-MiniLM-L6-v2 (384-d) · 6-Pair Cosine Agreement · DeBERTa-v3 NLP
            </p>
          </div>
        </div>
      }
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: gateBg,
            color: gateColor,
            border: `1px solid ${gateColor}40`
          }}>
            {isBlock ? <ShieldAlert size={14} /> : isAllow ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
            Action Gate: {actionGateDecision}
          </span>
        </div>
      }
      innerStyle={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Top Banner: 4 Semantic Views Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        {/* V1: User Task */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
              VIEW 1: AUTHORIZED TASK
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>V1</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
            "{views.userTask}"
          </p>
        </div>

        {/* V2: System Prompt */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.05em' }}>
              VIEW 2: SYSTEM GUARDRAIL
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>V2</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
            "{views.systemPrompt}"
          </p>
        </div>

        {/* V3: Proposed Tool Action */}
        <div style={{
          background: isS13Discrepancy ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${isS13Discrepancy ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 800, 
              color: isS13Discrepancy ? '#f87171' : '#34d399', 
              letterSpacing: '0.05em' 
            }}>
              VIEW 3: PROPOSED ACTION
            </span>
            <span style={{ fontSize: '0.65rem', color: isS13Discrepancy ? '#f87171' : 'var(--text-muted)' }}>
              {isS13Discrepancy ? 'HIJACKED' : 'V3'}
            </span>
          </div>
          <code style={{ 
            fontSize: '0.75rem', 
            color: isS13Discrepancy ? '#fca5a5' : '#86efac', 
            wordBreak: 'break-all',
            fontFamily: 'var(--font-mono)'
          }}>
            {views.proposedAction}
          </code>
        </div>

        {/* V4: Observation Context */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>
              VIEW 4: OBSERVATION CONTEXT
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>V4</span>
          </div>
          <p style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)', 
            margin: 0, 
            lineHeight: 1.4,
            maxHeight: '44px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            "{views.observationContext}"
          </p>
        </div>
      </div>

      {/* Center Grid: Cosine Agreement Heatmap & Dual Head Gauges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left: 4x4 Pairwise Cosine Agreement Heatmap */}
        <div style={{
          background: 'rgba(10, 15, 29, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#818cf8" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Pairwise Cosine Agreement Matrix (S_ij)
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              all-MiniLM-L6-v2 (384-d)
            </span>
          </div>

          {/* Matrix Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'separate', 
              borderSpacing: '4px',
              fontSize: '0.75rem',
              textAlign: 'center'
            }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px', color: 'var(--text-muted)' }}></th>
                  {viewHeaders.map((vh, idx) => (
                    <th key={idx} style={{ 
                      padding: '6px 4px', 
                      color: 'var(--text-secondary)', 
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}>
                      {vh}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agreementMatrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ 
                      padding: '6px 8px', 
                      fontWeight: 700, 
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontSize: '0.7rem'
                    }}>
                      {viewHeaders[rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const isTaskActionCell = (rIdx === 0 && cIdx === 2) || (rIdx === 2 && cIdx === 0);
                      const colorInfo = isDiagonal 
                        ? { bg: 'rgba(255, 255, 255, 0.05)', text: 'var(--text-muted)', border: 'transparent' }
                        : getHeatmapColor(val);

                      return (
                        <td 
                          key={cIdx}
                          style={{
                            padding: '8px 4px',
                            background: colorInfo.bg,
                            color: colorInfo.text,
                            fontWeight: isTaskActionCell ? 800 : 600,
                            borderRadius: '6px',
                            border: isTaskActionCell ? `2px solid ${colorInfo.text}` : `1px solid ${colorInfo.border}`,
                            position: 'relative'
                          }}
                          title={`Cosine similarity between ${viewHeaders[rIdx]} and ${viewHeaders[cIdx]}: ${val.toFixed(2)}`}
                        >
                          {val.toFixed(2)}
                          {isTaskActionCell && (
                            <span style={{
                              display: 'block',
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              S_13
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* S13 Callout Banner */}
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: isS13Discrepancy ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isS13Discrepancy ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {isS13Discrepancy ? (
              <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
            )}
            <div style={{ fontSize: '0.74rem', lineHeight: 1.35 }}>
              {isS13Discrepancy ? (
                <span>
                  <strong style={{ color: '#f87171' }}>Geometric Discrepancy (S_13 = {s13.toFixed(2)}):</strong> Proposed tool action deviates sharply from authorized user instructions. Strong invariant of indirect hijacking!
                </span>
              ) : (
                <span>
                  <strong style={{ color: '#34d399' }}>Semantic Alignment (S_13 = {s13.toFixed(2)}):</strong> Proposed tool action directly maps to user task intent. No injection discrepancy detected.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Dual Output Heads (Risk + Uncertainty) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Head 1: DeBERTa-v3 NLP Signal & Risk Head */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Head 1: Risk Probability Head (Softmax)
                </span>
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                color: debertaInjectionProb > 0.5 ? '#f87171' : '#34d399' 
              }}>
                {(debertaInjectionProb * 100).toFixed(1)}% P(Inject)
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                width: `${debertaInjectionProb * 100}%`,
                height: '100%',
                background: debertaInjectionProb > 0.5 
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                  : 'linear-gradient(90deg, #10b981, #06b6d4)',
                borderRadius: '6px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>NLP Tokenizer: DeBERTa-v3-small (256 tokens)</span>
              <span>Disentangled Attention v3</span>
            </div>
          </div>

          {/* Head 2: Epistemic Uncertainty Estimation (Sigmoid) */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#a78bfa" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Head 2: Epistemic Uncertainty U ∈ [0, 1]
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: uncertaintyScore > 0.35 ? '#fbbf24' : '#a78bfa',
                background: 'rgba(167, 139, 250, 0.1)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(167, 139, 250, 0.25)'
              }}>
                U = {uncertaintyScore.toFixed(3)}
              </span>
            </div>

            {/* Uncertainty Visual Meter */}
            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                width: `${uncertaintyScore * 100}%`,
                height: '100%',
                background: uncertaintyScore > 0.35 
                  ? 'linear-gradient(90deg, #818cf8, #f59e0b)' 
                  : 'linear-gradient(90deg, #6366f1, #a78bfa)',
                borderRadius: '4px'
              }} />
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
              {uncertaintyScore < 0.20 ? (
                <span><strong>High Confidence:</strong> Classification is well-supported by familiar feature distributions. Low residual loss expected.</span>
              ) : uncertaintyScore < 0.40 ? (
                <span><strong>Nominal Dispersion:</strong> Standard variance across multi-view embedding boundaries.</span>
              ) : (
                <span><strong>Elevated Uncertainty:</strong> Boundary sample or novel adversarial perturbation detected. Human affirmation requested.</span>
              )}
            </p>
          </div>

          {/* Action Gate Rationale */}
          <div style={{
            background: gateBg,
            border: `1px solid ${gateColor}40`,
            borderRadius: '12px',
            padding: '12px 14px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontWeight: 700, 
              fontSize: '0.75rem',
              color: gateColor,
              marginBottom: '4px'
            }}>
              <span>DECISION ENGINE RATIONALE</span>
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.35 }}>
              {gateRationale}
            </p>
          </div>
        </div>
      </div>
    </DoubleBezelCard>
  );
};
