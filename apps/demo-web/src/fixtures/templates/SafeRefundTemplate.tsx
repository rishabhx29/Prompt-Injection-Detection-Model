import React, { useState } from 'react';
import { ShieldCheck, RotateCcw, CheckCircle2, ChevronDown, ChevronUp, Search } from 'lucide-react';

export const SafeRefundTemplate: React.FC = () => {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [orderId, setOrderId] = useState('ORD-9418');
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupMessage(`Order ${orderId}: Eligible for standard return until Oct 15, 2026.`);
  };

  const accordions = [
    {
      title: '30-Day Return & Exchange Window',
      content: 'We accept returns on items in original condition with packaging within 30 days of delivery. Refunds are credited to the original payment method.'
    },
    {
      title: 'Return Shipping & Prepaid Labels',
      content: 'Domestic returns include a complimentary prepaid shipping label. Simply pack the item and drop it off at any authorized courier location.'
    },
    {
      title: 'Refund Processing & Timelines',
      content: 'Once received at our fulfillment center, items undergo standard inspection within 48 hours. Credit card refunds reflect within 3 to 5 business days.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#e2e8f0', fontSize: '0.82rem' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <RotateCcw size={16} color="#10b981" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
              ShopEase Returns & Exchanges
            </h4>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Official Customer Satisfaction Portal</span>
          </div>
        </div>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          color: '#10b981',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '2px 8px',
          borderRadius: '9999px',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <ShieldCheck size={11} />
          Verified Merchant
        </span>
      </div>

      {/* Return Progress Stepper */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        padding: '10px 14px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em' }}>
          Hassle-Free 4-Step Process
        </span>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginTop: '8px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', color: '#060911', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.68rem' }}>1</div>
            <span style={{ fontSize: '0.68rem', color: '#f8fafc', fontWeight: 500 }}>Request</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.68rem' }}>2</div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Print Label</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.68rem' }}>3</div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Inspect</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.68rem' }}>4</div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Refund</span>
          </div>
        </div>
      </div>

      {/* Accordion Policy Terms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {accordions.map((item, idx) => {
          const isOpen = activeAccordion === idx;
          return (
            <div
              key={idx}
              style={{
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                background: isOpen ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)',
                overflow: 'hidden',
                transition: 'all 0.15s ease'
              }}
            >
              <button
                onClick={() => setActiveAccordion(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>{item.title}</span>
                {isOpen ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
              </button>
              {isOpen && (
                <div style={{ padding: '0 12px 8px 12px', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Lookup Form */}
      <form onSubmit={handleLookup} style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        paddingTop: '6px'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID (e.g. ORD-9418)"
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#f8fafc',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)'
            }}
          />
          <Search size={13} color="#64748b" style={{ position: 'absolute', left: '8px', top: '8px' }} />
        </div>
        <button
          type="submit"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--primary)',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Check Eligibility
        </button>
      </form>

      {lookupMessage && (
        <div style={{
          fontSize: '0.72rem',
          color: '#34d399',
          background: 'rgba(16, 185, 129, 0.08)',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={13} />
          <span>{lookupMessage}</span>
        </div>
      )}
    </div>
  );
};
