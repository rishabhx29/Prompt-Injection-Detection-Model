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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #a7f3d0'
          }}>
            <RotateCcw size={16} color="#059669" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ShopEase Returns & Exchanges
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Official Customer Satisfaction Portal</span>
          </div>
        </div>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: '#059669',
          background: '#ecfdf5',
          padding: '2px 8px',
          borderRadius: '9999px',
          border: '1px solid #a7f3d0',
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
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '12px 14px',
        border: '1px solid var(--border-subtle)'
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
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
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.68rem' }}>1</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>Request</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.68rem' }}>2</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Print Label</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.68rem' }}>3</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Inspect</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.68rem' }}>4</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Refund</span>
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
                border: '1px solid var(--border-subtle)',
                background: isOpen ? '#f1f5f9' : '#ffffff',
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
                  padding: '9px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>{item.title}</span>
                {isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </button>
              {isOpen && (
                <div style={{ padding: '0 12px 10px 12px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
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
        gap: '8px',
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
              padding: '7px 10px 7px 30px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: '#ffffff',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)'
            }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '9px', top: '9px' }} />
        </div>
        <button
          type="submit"
          style={{
            padding: '7px 14px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--primary)',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Check Eligibility
        </button>
      </form>

      {lookupMessage && (
        <div style={{
          fontSize: '0.76rem',
          color: '#065f46',
          background: '#ecfdf5',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={14} color="#059669" />
          <span>{lookupMessage}</span>
        </div>
      )}
    </div>
  );
};
