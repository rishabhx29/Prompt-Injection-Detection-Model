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
          <Globe size={16} color="#4f46e5" />
          <span>Simulated Web Browser</span>
        </div>
      }
      headerRight={
        onToggleExtractionMode ? (
          <button
            onClick={onToggleExtractionMode}
            style={{
              background: extractionMode === 'live-dom' ? '#e0e7ff' : '#ffffff',
              border: `1px solid ${extractionMode === 'live-dom' ? '#a5b4fc' : 'var(--border-subtle)'}`,
              color: extractionMode === 'live-dom' ? '#4338ca' : 'var(--text-secondary)',
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
        background: '#f8fafc',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'calc(var(--radius-lg) - 1px)'
      }}>
        {/* URL Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: '#f1f5f9',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#27c93f' }} />
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}>
            <Lock size={12} color="#059669" />
            <span style={{ color: '#0f172a', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {url}
            </span>
          </div>

          {/* AX Spotlight Toggle Button */}
          {accessibilityText.length > 0 && (
            <button
              onClick={() => setShowAriaInspector(!showAriaInspector)}
              style={{
                background: showAriaInspector ? '#fff1f2' : '#f0f9ff',
                border: `1px solid ${showAriaInspector ? '#fecdd3' : '#bae6fd'}`,
                color: showAriaInspector ? '#e11d48' : '#0284c7',
                borderRadius: '6px',
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
            background: '#ffffff',
            color: '#0f172a',
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
