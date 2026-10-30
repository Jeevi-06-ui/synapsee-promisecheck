import React, { useState } from 'react';
import { Tag, CheckCircle2, AlertCircle, ArrowRight, Truck, Sparkles, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPaise } from '../utils/calc';
import { useNavigate } from 'react-router-dom';

interface OrderSummaryProps {
  isCheckoutPage?: boolean;
  onPlaceDemoOrder?: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  isCheckoutPage = false,
  onPlaceDemoOrder,
}) => {
  const {
    calculation,
    couponCode,
    couponInput,
    setCouponInput,
    couponMessage,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const navigate = useNavigate();
  const [internalCode, setInternalCode] = useState(couponInput || '');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (internalCode.trim()) {
      applyCoupon(internalCode.trim());
      setCouponInput(internalCode.trim());
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setInternalCode('');
  };

  const remainingForFreeDelivery = Math.max(
    0,
    calculation.freeDeliveryThresholdPaise - calculation.subtotalPaise
  );

  return (
    <div className="order-summary-box" data-testid="order-summary">
      <h3 className="summary-title">Order Summary</h3>

      {/* Free Delivery Banner */}
      {calculation.subtotalPaise > 0 && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: calculation.freeDeliveryQualified ? '#E6F4EA' : '#FEF7E0',
            border: `1px solid ${calculation.freeDeliveryQualified ? '#A8DAB5' : '#FEE085'}`,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          data-testid="delivery-status-banner"
        >
          <Truck
            size={18}
            color={calculation.freeDeliveryQualified ? '#137333' : '#B06000'}
          />
          <span>
            {calculation.freeDeliveryQualified ? (
              <strong style={{ color: '#137333' }}>You have unlocked FREE Delivery!</strong>
            ) : (
              <span>
                Add{' '}
                <strong style={{ color: '#B06000' }}>
                  {formatPaise(remainingForFreeDelivery)}
                </strong>{' '}
                more food to get <strong>FREE delivery</strong> (Orders ₹499+).
              </span>
            )}
          </span>
        </div>
      )}

      {/* Line items */}
      <div className="summary-row">
        <span>Food Subtotal</span>
        <span className="amount" data-testid="subtotal-amount">
          {formatPaise(calculation.subtotalPaise)}
        </span>
      </div>

      <div className="summary-row discount-row">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={15} />
          <span>Discount {calculation.isCouponApplied ? `(${couponCode})` : ''}</span>
        </span>
        <span className="amount" data-testid="discount-amount">
          {calculation.discountPaise > 0
            ? `-${formatPaise(calculation.discountPaise)}`
            : formatPaise(0)}
        </span>
      </div>

      <div className="summary-row">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Truck size={15} />
          <span>Delivery Fee</span>
        </span>
        <span className="amount" data-testid="delivery-amount">
          {calculation.deliveryPaise === 0 && calculation.subtotalPaise > 0 ? (
            <span style={{ color: '#137333', fontWeight: 700 }}>FREE</span>
          ) : (
            formatPaise(calculation.deliveryPaise)
          )}
        </span>
      </div>

      <div className="summary-row total-row">
        <span>Total Payable</span>
        <span className="amount" data-testid="total-amount">
          {formatPaise(calculation.totalPaise)}
        </span>
      </div>

      {calculation.savingsPaise > 0 && (
        <div
          style={{
            textAlign: 'center',
            color: '#137333',
            fontWeight: 600,
            fontSize: '0.875rem',
            margin: '0.5rem 0',
            backgroundColor: '#E6F4EA',
            padding: '0.35rem',
            borderRadius: '4px',
          }}
          data-testid="savings-banner"
        >
          🎉 Total Savings on this order: {formatPaise(calculation.savingsPaise)}
        </div>
      )}

      {/* Coupon Application Section */}
      <div className="coupon-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: '#163829' }}>
          <Tag size={16} color="#E05A2B" />
          <span>Have a Promo Coupon?</span>
        </div>

        {calculation.isCouponApplied ? (
          <div className="coupon-tag" style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>
                <strong>{couponCode}</strong> applied ({formatPaise(calculation.discountPaise)} off)
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              aria-label="Remove coupon"
              data-testid="remove-coupon-btn"
              style={{ color: '#56685E', padding: '0.2rem' }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="coupon-form">
            <input
              type="text"
              placeholder="e.g. WELCOME20"
              value={internalCode}
              onChange={(e) => setInternalCode(e.target.value)}
              className="coupon-input"
              aria-label="Coupon code input"
              data-testid="coupon-input"
            />
            <button
              type="submit"
              className="coupon-btn"
              data-testid="apply-coupon-btn"
            >
              Apply
            </button>
          </form>
        )}

        {couponMessage && (
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: couponMessage.type === 'error' ? '#C5221F' : '#137333',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            data-testid="coupon-message"
          >
            {couponMessage.type === 'error' ? (
              <AlertCircle size={14} />
            ) : (
              <CheckCircle2 size={14} />
            )}
            <span>{couponMessage.text}</span>
          </div>
        )}

        <div style={{ fontSize: '0.75rem', color: '#56685E', marginTop: '0.5rem' }}>
          Use <strong>WELCOME20</strong> for 20% off on food orders of ₹200 or more (Max ₹100).
        </div>
      </div>

      {/* Blocked reason banner */}
      {!calculation.isCheckoutAllowed && calculation.checkoutBlockedReason && (
        <div
          className="alert-notice error"
          data-testid="checkout-blocked-reason"
          role="alert"
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{calculation.checkoutBlockedReason}</span>
        </div>
      )}

      {/* Action Button */}
      {isCheckoutPage ? (
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={!calculation.isCheckoutAllowed}
          onClick={onPlaceDemoOrder}
          data-testid="place-demo-order-btn"
        >
          <span>Place Demo Order (Simulation Only)</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={!calculation.isCheckoutAllowed}
          onClick={() => navigate('/checkout')}
          data-testid="checkout-btn"
        >
          <span>Proceed to Checkout (Demo)</span>
          <ArrowRight size={18} />
        </button>
      )}

      <div
        style={{
          marginTop: '0.75rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#83958B',
        }}
      >
        🔒 Demonstration Only &bull; All prices in INR paise &bull; No card or bank details required
      </div>
    </div>
  );
};

