import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useScenario } from '../context/ScenarioContext';
import { formatPaise } from '../utils/calc';
import { OrderSummary } from '../components/OrderSummary';

export const CheckoutPage: React.FC = () => {
  const { items, calculation, clearCart } = useCart();
  const { scenario } = useScenario();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // Demo form fields
  const [name, setName] = useState('Demo Customer');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('Flat 402, Green Orchid, Presidency Tech Park, Bengaluru');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');

  const handlePlaceOrder = () => {
    if (!calculation.isCheckoutAllowed) return;

    // Simulate order placement
    const randomId = 'SYN-' + Math.floor(100000 + Math.random() * 900000);
    setOrderId(randomId);
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="container" style={{ maxWidth: '650px', textAlign: 'center', padding: '3rem 1rem' }}>
        <div
          style={{
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--green-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--green-forest)',
          }}
        >
          <CheckCircle2 size={44} />
        </div>

        <span
          style={{
            backgroundColor: 'var(--green-light)',
            color: 'var(--green-forest)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Simulated Demonstration Success
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.25rem',
            color: 'var(--green-deep)',
            marginTop: '0.75rem',
            marginBottom: '0.5rem',
          }}
          data-testid="order-success-title"
        >
          Demo Order Placed!
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Thank you, <strong>{name}</strong>! Your demonstration order <strong>#{orderId}</strong> has been simulated.
          No payment was charged, and no real delivery will take place.
        </p>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'left',
            marginBottom: '2rem',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
            <strong>#{orderId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Delivering To:</span>
            <span>{address}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
            <span>{paymentMethod.toUpperCase()} (Simulated)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Scenario Verified:</span>
            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{scenario} Mode</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/menu" className="btn-primary">
            <span>Order Again</span>
          </Link>
          <Link to="/demo-controls" className="btn-secondary">
            <span>Presenter Controls</span>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ maxWidth: '650px', textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          style={{
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: '50%',
            backgroundColor: '#EDE7DC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--green-forest)',
          }}
        >
          <ShoppingBag size={36} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            color: 'var(--green-deep)',
            marginBottom: '0.75rem',
          }}
        >
          Nothing to Checkout
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '2rem' }}>
          Your cart is currently empty. Please add items from our menu to proceed to checkout review.
        </p>
        <Link to="/menu" className="btn-primary">
          <ArrowLeft size={18} />
          <span>Go to Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.25rem',
            color: 'var(--green-deep)',
            marginBottom: '0.25rem',
          }}
        >
          Checkout Review
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Please review your itemised items and verify checkout eligibility.
        </p>
      </div>

      {/* Scenario Defect Alert if Buggy Mode blocks checkout */}
      {!calculation.isCheckoutAllowed && (
        <div
          className="alert-notice error"
          style={{ marginBottom: '1.5rem' }}
          data-testid="checkout-page-blocked-notice"
        >
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Checkout Blocked: </strong>
            <span>{calculation.checkoutBlockedReason}</span>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)',
          gap: '2.5rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Itemised Review Box */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                color: 'var(--green-deep)',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.5rem',
              }}
            >
              Itemised Items ({items.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} data-testid="checkout-items-list">
              {items.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px dashed #E8E2D5',
                  }}
                  data-testid={`checkout-item-${item.productId}`}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--green-deep)' }}>
                      {item.product.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      &times; {item.quantity}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: '#83958B' }}>
                      {formatPaise(item.product.pricePaise)} each
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {formatPaise(item.quantity * item.product.pricePaise)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <Link
                to="/cart"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  color: 'var(--green-forest)',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} />
                <span>Modify quantities in Cart</span>
              </Link>
            </div>
          </div>

          {/* Demonstration Delivery Details */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  color: 'var(--green-deep)',
                  margin: 0,
                }}
              >
                Delivery Address (Demo Simulation)
              </h2>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#EDE7DC', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, color: '#56685E' }}>
                Fictional Only
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-strong)', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-strong)', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Delivery Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-strong)', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                color: 'var(--green-deep)',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.5rem',
              }}
            >
              Simulated Payment Mode
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { id: 'cod', label: 'Cash on Delivery (Simulated)', desc: 'Pay when fictional delivery arrives' },
                { id: 'upi', label: 'UPI / QR Code Simulation', desc: 'Mock instant UPI payment authorization' },
                { id: 'card', label: 'Test Credit / Debit Card', desc: 'Simulation sandbox test checkout' },
              ].map((p) => (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${paymentMethod === p.id ? 'var(--green-deep)' : 'var(--border-subtle)'}`,
                    backgroundColor: paymentMethod === p.id ? 'var(--green-light)' : '#FFF',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p.id}
                    checked={paymentMethod === p.id}
                    onChange={() => setPaymentMethod(p.id as any)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--green-deep)', fontSize: '0.9rem' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Place Demo Order Button */}
        <div>
          <OrderSummary isCheckoutPage onPlaceDemoOrder={handlePlaceOrder} />
        </div>
      </div>
    </div>
  );
};
