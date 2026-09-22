import React, { useState } from 'react';
import { 
  Lock, 
  Info, 
  Layers, 
  Sparkles,
  Globe
} from 'lucide-react';
import type { FixtureScenario } from '../fixtures/types';
import type { ExtractionMode } from '../services/extraction';
import { DoubleBezelCard } from './common/DoubleBezelCard';
import {
  SafeRefundTemplate,
  AriaAttackTemplate,
  VisibleAttackTemplate,
  TaskDeviationTemplate,
  BenignAriaTemplate,
  InjecAgentTemplate
} from '../fixtures/templates';

interface WebpagePreviewProps {
  fixture: FixtureScenario;
  extractionMode?: ExtractionMode;
  onToggleExtractionMode?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const WebpagePreview: React.FC<WebpagePreviewProps> = ({ 
  fixture,
  extractionMode = 'catalog',
  onToggleExtractionMode,
  containerRef
}) => {
  const { url, accessibilityText } = fixture.scanRequest.page;
  const [showAriaInspector, setShowAriaInspector] = useState(false);

  const isInjecAgent = fixture.id === 'injecagent-indirect-hijack';
  const isAriaAttack = fixture.id === 'aria-injection';
  const isVisibleAttack = fixture.id === 'visible-injection';
  const isSafeRefund = fixture.id === 'safe-refund-page';
  const isTaskDeviation = fixture.id === 'task-deviation-settings';
  const isBenignAria = fixture.id === 'benign-aria-negative';

  return (
    <DoubleBezelCard
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={16} color="#818cf8" />
          <span>Simulated Web Browser</span>
        </div>
      }
      headerRight={
        onToggleExtractionMode ? (
          <button
            onClick={onToggleExtractionMode}
            style={{
              background: extractionMode === 'live-dom' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${extractionMode === 'live-dom' ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
              color: extractionMode === 'live-dom' ? '#a5b4fc' : 'var(--text-secondary)',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            title="Toggle between frozen fixture catalog representation and live DOM extraction"
          >
            <Layers size={11} />
            <span>Extractor: <strong>{extractionMode === 'live-dom' ? 'Live DOM' : 'Catalog Spec'}</strong></span>
          </button>
        ) : undefined
      }
      innerStyle={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Browser Chrome Shell */}
      <div style={{
        background: '#0a0f1d',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* URL Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }} />
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.04)',
            padding: '4px 10px',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}>
            <Lock size={12} color="#10b981" />
            <span style={{ color: '#e2e8f0', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {url}
            </span>
          </div>

          {/* AX Spotlight Toggle Button */}
          {accessibilityText.length > 0 && (
            <button
              onClick={() => setShowAriaInspector(!showAriaInspector)}
              style={{
                background: showAriaInspector ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.15)',
                border: `1px solid ${showAriaInspector ? 'rgba(239, 68, 68, 0.5)' : 'rgba(56, 189, 248, 0.3)'}`,
                color: showAriaInspector ? '#fca5a5' : '#38bdf8',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
              title="Highlight visually hidden ARIA / AXTree attributes in-situ"
            >
              {showAriaInspector ? <Sparkles size={11} /> : <Info size={11} />}
              <span>{showAriaInspector ? 'Spotlight ON' : 'Inspect AX'}</span>
            </button>
          )}
        </div>

        {/* Rendered Web Content Container (Target for LiveDomExtractor) */}
        <div 
          ref={containerRef}
          id="sandbox-page-container"
          style={{
            padding: '16px',
            minHeight: '260px',
            maxHeight: '300px',
            overflowY: 'auto',
            background: '#0f172a',
            color: '#e2e8f0',
            fontSize: '0.85rem'
          }}
        >
          {isSafeRefund && <SafeRefundTemplate />}
          {isInjecAgent && <InjecAgentTemplate />}
          {isAriaAttack && <AriaAttackTemplate showAriaSpotlight={showAriaInspector} />}
          {isVisibleAttack && <VisibleAttackTemplate />}
          {isTaskDeviation && <TaskDeviationTemplate />}
          {isBenignAria && <BenignAriaTemplate />}
        </div>
      </div>
    </DoubleBezelCard>
  );
};
