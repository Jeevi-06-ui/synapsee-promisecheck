import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPaise } from '../utils/calc';
import { OrderSummary } from '../components/OrderSummary';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="container" style={{ maxWidth: '650px', textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          style={{
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            backgroundColor: '#EDE7DC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--green-forest)',
          }}
        >
          <ShoppingBag size={38} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            color: 'var(--green-deep)',
            marginBottom: '0.75rem',
          }}
        >
          Your Cart is Empty
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '2rem' }}>
          Looks like you haven't added any delicious food yet. Check out our wood-fired pizzas, hearty wraps, and value combos!
        </p>
        <Link to="/menu" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
          <ArrowLeft size={18} />
          <span>Browse Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.25rem',
              color: 'var(--green-deep)',
              marginBottom: '0.25rem',
            }}
          >
            Your Shopping Cart
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="btn-secondary"
          style={{ color: 'var(--status-red)', borderColor: 'var(--status-red-border)', backgroundColor: '#FFF' }}
          data-testid="clear-cart-btn"
          aria-label="Clear all items from cart"
        >
          <Trash2 size={16} />
          <span>Clear Cart</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)',
          gap: '2.5rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Cart Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} data-testid="cart-items-list">
          {items.map((item) => (
            <div
              key={item.productId}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
              data-testid={`cart-item-${item.productId}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    backgroundColor: '#EDE7DC',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.1rem',
                      color: 'var(--green-deep)',
                      marginBottom: '0.25rem',
                    }}
                    data-testid={`cart-item-name-${item.productId}`}
                  >
                    {item.product.name}
                  </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Unit price: <strong>{formatPaise(item.product.pricePaise)}</strong>
                  </div>
                </div>
              </div>

              {/* Quantity Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                  className="quantity-controller"
                  role="group"
                  aria-label={`Quantity controls for ${item.product.name}`}
                >
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => decrementQuantity(item.productId)}
                    aria-label={`Decrease ${item.product.name} quantity`}
                    data-testid={`cart-qty-decrease-${item.productId}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span
                    className="qty-display"
                    aria-live="polite"
                    data-testid={`cart-qty-value-${item.productId}`}
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => incrementQuantity(item.productId)}
                    disabled={item.quantity >= 10}
                    aria-label={`Increase ${item.product.name} quantity`}
                    data-testid={`cart-qty-increase-${item.productId}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Line Item Total */}
                <div
                  style={{
                    minWidth: '85px',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'var(--text-main)',
                  }}
                  data-testid={`cart-item-total-${item.productId}`}
                >
                  {formatPaise(item.quantity * item.product.pricePaise)}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Remove ${item.product.name} from cart`}
                  style={{
                    color: '#83958B',
                    padding: '0.35rem',
                    borderRadius: '4px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#C5221F')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#83958B')}
                  data-testid={`cart-remove-item-${item.productId}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '0.5rem' }}>
            <Link
              to="/menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--green-forest)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <ArrowLeft size={16} />
              <span>Add more items from Menu</span>
            </Link>
          </div>
        </div>

        {/* Order Summary & Coupon */}
        <div>
          <OrderSummary />
        </div>
      </div>
    </div>
  );
};
