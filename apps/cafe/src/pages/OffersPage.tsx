import React, { useState } from 'react';
import { Tag, Truck, Copy, Check, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OffersPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('WELCOME20');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--orange-accent)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          <Tag size={16} />
          <span>Transparent Pricing & Offers</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            color: 'var(--green-deep)',
            marginBottom: '0.75rem',
          }}
        >
          Advertised Offers & Checkout Rules
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>
          Our business rules and promotional promises are clearly documented below. In honest commerce, checkout calculations must match advertised terms exactly.
        </p>
      </div>

      {/* Offer 1: Free Delivery */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
        }}
        data-testid="offer-free-delivery"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green-forest)',
              flexShrink: 0,
            }}
          >
            <Truck size={24} />
          </div>

          <div style={{ flex: 1 }}>
            <span
              style={{
                backgroundColor: 'var(--green-light)',
                color: 'var(--green-forest)',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Delivery Promise
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                color: 'var(--green-deep)',
                margin: '0.5rem 0',
              }}
            >
              Free Delivery on Food Subtotal ₹499 and Above
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Standard delivery fee is <strong>₹40.00</strong> (4000 paise). When the food subtotal before coupons is <strong>₹499.00</strong> (49900 paise) or more, delivery is completely <strong>FREE</strong>.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-cream)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                fontSize: '0.875rem',
              }}
            >
              <h4 style={{ fontWeight: 700, color: 'var(--green-deep)', marginBottom: '0.4rem' }}>
                Complete Terms & Conditions:
              </h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <li>Standard delivery fee: 4000 paise (₹40.00).</li>
                <li>Qualification threshold: Food subtotal BEFORE coupon is 49900 paise (₹499.00) or more.</li>
                <li>Free delivery applies automatically when threshold is met.</li>
                <li>Coupons applied do not reduce the qualification subtotal for free delivery.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Offer 2: WELCOME20 Coupon */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
        }}
        data-testid="offer-welcome20"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--orange-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--orange-accent)',
              flexShrink: 0,
            }}
          >
            <Tag size={24} />
          </div>

          <div style={{ flex: 1 }}>
            <span
              style={{
                backgroundColor: 'var(--orange-light)',
                color: 'var(--orange-accent)',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Promo Code
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  color: 'var(--green-deep)',
                  margin: 0,
                }}
              >
                WELCOME20 — 20% Off (Max ₹100 Discount)
              </h2>

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#F3EDE2',
                  border: '1px solid var(--border-strong)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--green-deep)',
                }}
                aria-label="Copy coupon code WELCOME20"
              >
                {copied ? <Check size={14} color="#137333" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'WELCOME20'}</span>
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              First-time and returning visitors enjoy <strong>20% off</strong> on food subtotals of <strong>₹200.00</strong> (20000 paise) or more, with a maximum discount cap of <strong>₹100.00</strong> (10000 paise).
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-cream)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                fontSize: '0.875rem',
              }}
            >
              <h4 style={{ fontWeight: 700, color: 'var(--green-deep)', marginBottom: '0.4rem' }}>
                Complete Terms & Conditions:
              </h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <li>Valid only for food subtotal of at least 20000 paise (₹200.00).</li>
                <li>Discount rate is 20% (0.20) of the food subtotal.</li>
                <li>Maximum discount cap is 10000 paise (₹100.00).</li>
                <li>Discount is rounded to nearest paise, half up (e.g. Math.round(subtotal * 0.20)).</li>
                <li>Strictly one coupon per cart.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* General Checkout Rules */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '3rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <Info size={22} color="var(--green-forest)" />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--green-deep)', margin: 0 }}>
            General Ordering & Checkout Rules
          </h3>
        </div>

        <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.925rem' }}>
          <li><strong>Currency & Pricing:</strong> All values stored and calculated in integer Indian paise (INR).</li>
          <li><strong>Taxes & Fees:</strong> Menu prices include all applicable taxes for this fictional demo store. No additional tax, packaging, or hidden service fee is charged.</li>
          <li><strong>Minimum Order:</strong> There is <em>no minimum order requirement</em>. Only an empty cart prevents checkout in fixed mode.</li>
          <li><strong>Final Payable Formula:</strong> <code>Total = Subtotal - Discount + Delivery</code>.</li>
          <li><strong>Quantity Limits:</strong> Integer quantities from 1 to 10 per item. Extra Dip is an ordinary selectable item.</li>
        </ul>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Link to="/menu" className="btn-primary">
            <span>Start Building Cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
