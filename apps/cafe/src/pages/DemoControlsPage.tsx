import React, { useState } from 'react';
import { Sliders, ShieldCheck, ShieldAlert, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { useNavigate } from 'react-router-dom';

export const DemoControlsPage: React.FC = () => {
  const { scenario, setScenario } = useScenario();
  const { clearCart, addItem, applyCoupon } = useCart();
  const navigate = useNavigate();
  const [loadNotice, setLoadNotice] = useState<string | null>(null);

  const handleScenarioChange = (newScenario: 'fixed' | 'buggy') => {
    if (newScenario !== scenario) {
      setScenario(newScenario);
      setLoadNotice(`Switched to ${newScenario.toUpperCase()} scenario. Cart and coupon were automatically reset.`);
      setTimeout(() => setLoadNotice(null), 3500);
    }
  };

  const handleClear = () => {
    clearCart();
    setLoadNotice('Cart and applied coupons have been cleared.');
    setTimeout(() => setLoadNotice(null), 3000);
  };

  // Quick Fixture Loaders for Demo Presenters
  const loadFixture = (fixtureIndex: number) => {
    clearCart();
    setTimeout(() => {
      if (fixtureIndex === 1) {
        // 2 Margherita Pizzas = ₹498
        addItem(PRODUCTS['margherita-pizza'], 2);
        setLoadNotice('Loaded Fixture 1: 2 Margherita Pizzas (₹498). Fixed & Buggy delivery ₹40; Total ₹538.');
      } else if (fixtureIndex === 2) {
        // 2 Margherita Pizzas + 1 Extra Dip = ₹499
        addItem(PRODUCTS['margherita-pizza'], 2);
        addItem(PRODUCTS['extra-dip'], 1);
        setLoadNotice('Loaded Fixture 2: 2 Margherita Pizzas + 1 Extra Dip (₹499). Fixed: ₹0 delivery (Total ₹499) vs Buggy: ₹40 delivery (Total ₹539).');
      } else if (fixtureIndex === 3) {
        // 2 Margherita Pizzas + 2 Extra Dips = ₹500
        addItem(PRODUCTS['margherita-pizza'], 2);
        addItem(PRODUCTS['extra-dip'], 2);
        setLoadNotice('Loaded Fixture 3: 2 Margherita Pizzas + 2 Extra Dips (₹500). Both scenarios: ₹0 delivery; Total ₹500.');
      } else if (fixtureIndex === 4) {
        // 2 Family Combos + 2 Extra Dips + WELCOME20 = ₹600
        addItem(PRODUCTS['family-combo'], 2);
        addItem(PRODUCTS['extra-dip'], 2);
        applyCoupon('WELCOME20');
        setLoadNotice('Loaded Fixture 4: 2 Family Combos + 2 Extra Dips + WELCOME20 (₹600). Fixed: ₹100 discount (Total ₹500) vs Buggy: ₹120 discount (Total ₹480).');
      } else if (fixtureIndex === 5) {
        // 1 Veg Burger = ₹99
        addItem(PRODUCTS['veg-burger'], 1);
        setLoadNotice('Loaded Fixture 5: 1 Veg Burger (₹99). Fixed: checkout allowed (Total ₹139) vs Buggy: checkout blocked (subtotal < ₹199).');
      }
    }, 50);
  };

  return (
    <div className="container" style={{ maxWidth: '960px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--green-leaf)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          <Sliders size={16} />
          <span>Hackathon Presenter Console</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            color: 'var(--green-deep)',
            marginBottom: '0.75rem',
          }}
        >
          Demo Controls & Scenario Switcher
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>
          Switch runtime scenarios, observe deliberate defects, or preload automated testing fixtures for PromiseCheck and TinyFish evaluations.
        </p>
      </div>

      {loadNotice && (
        <div className="alert-notice info" style={{ marginBottom: '1.5rem' }}>
          <Sparkles size={18} />
          <span>{loadNotice}</span>
        </div>
      )}

      {/* Scenario Selection Section */}
      <div className="presenter-card">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--green-deep)', marginBottom: '0.5rem' }}>
          Active Runtime Scenario
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          Selecting a scenario updates browser storage and persists across navigation and refresh.
          <strong style={{ color: 'var(--orange-accent)', marginLeft: '0.35rem' }}>
            Note: Switching scenario automatically clears the cart and coupon.
          </strong>
        </p>

        <div className="scenario-switch-group">
          {/* Fixed Option */}
          <div
            className={`scenario-card-select ${scenario === 'fixed' ? 'selected' : ''}`}
            onClick={() => handleScenarioChange('fixed')}
            role="button"
            tabIndex={0}
            aria-pressed={scenario === 'fixed'}
            data-testid="select-scenario-fixed"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green-forest)', fontWeight: 700, fontSize: '1.1rem' }}>
                <ShieldCheck size={20} />
                <span>Fixed (Rule-Compliant)</span>
              </div>
              {scenario === 'fixed' && (
                <span style={{ backgroundColor: 'var(--green-forest)', color: '#FFF', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Follows all advertised rules strictly. Free delivery at &ge; ₹499, WELCOME20 20% discount capped at ₹100, and checkout allowed on all orders regardless of subtotal.
            </p>
          </div>

          {/* Buggy Option */}
          <div
            className={`scenario-card-select ${scenario === 'buggy' ? 'selected is-buggy' : ''}`}
            onClick={() => handleScenarioChange('buggy')}
            role="button"
            tabIndex={0}
            aria-pressed={scenario === 'buggy'}
            data-testid="select-scenario-buggy"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D96B27', fontWeight: 700, fontSize: '1.1rem' }}>
                <ShieldAlert size={20} />
                <span>Buggy (3 Defects)</span>
              </div>
              {scenario === 'buggy' && (
                <span style={{ backgroundColor: '#D96B27', color: '#FFF', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Contains 3 deliberately planted commercial discrepancies for PromiseCheck to detect via automated DOM inspection. Customer totals do not display bug labels.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Direct URLs for automated entry: <code>/?scenario=fixed</code> or <code>/?scenario=buggy</code>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
            data-testid="reset-cart-controls-btn"
          >
            <RotateCcw size={14} />
            <span>Reset Cart & Coupons</span>
          </button>
        </div>
      </div>

      {/* The 3 Deliberate Business Defects (Detailed Table) */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--green-deep)', marginBottom: '0.5rem' }}>
          Exact Defects Planted in Buggy Scenario
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '1rem' }}>
          As specified in the hackathon brief, the buggy scenario contains exactly these three business defects and no others:
        </p>

        <table className="rules-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Advertised & Fixed Scenario</th>
              <th>Buggy Scenario (Defect)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>1. Free Delivery Threshold</strong>
              </td>
              <td>
                Free delivery when food subtotal &ge; <strong>49,900 paise (₹499)</strong>.
              </td>
              <td style={{ color: 'var(--status-red)', fontWeight: 600 }}>
                Checks strictly subtotal &gt; 49,900 paise. At exactly ₹499.00, delivery fee of ₹40 is charged!
              </td>
            </tr>
            <tr>
              <td>
                <strong>2. WELCOME20 Maximum Cap</strong>
              </td>
              <td>
                20% discount on food subtotal &ge; ₹200, strictly capped at <strong>10,000 paise (₹100)</strong>.
              </td>
              <td style={{ color: 'var(--status-red)', fontWeight: 600 }}>
                Calculates 20% correctly but completely ignores the ₹100 cap (e.g. ₹600 order gives ₹120 discount).
              </td>
            </tr>
            <tr>
              <td>
                <strong>3. Minimum Order Subtotal</strong>
              </td>
              <td>
                No minimum order requirement. Any cart with items is eligible for checkout.
              </td>
              <td style={{ color: 'var(--status-red)', fontWeight: 600 }}>
                Incorrectly blocks checkout if food subtotal is below 19,900 paise (₹199), rejecting small orders like Veg Burger (₹99).
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Test Fixture Preloaders */}
      <div style={{ marginTop: '2.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--green-deep)', margin: 0 }}>
              One-Click Fixture Cart Loaders
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Populate the exact validation fixture carts from the project specification:
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#FFF', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--green-deep)', marginBottom: '0.25rem' }}>
              Fixture 1: ₹498 Cart
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              2 Margherita Pizzas (₹498).<br />Both scenarios: Delivery ₹40 &bull; Total ₹538.
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem' }}
              onClick={() => loadFixture(1)}
              data-testid="load-fixture-1-btn"
            >
              Load Fixture 1
            </button>
          </div>

          <div style={{ backgroundColor: '#FFF', border: '1px solid var(--orange-border)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--orange-accent)', marginBottom: '0.25rem' }}>
              Fixture 2: ₹499 Boundary
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              2 Margherita Pizzas + 1 Extra Dip (₹499).<br />Fixed: ₹0 delivery vs Buggy: ₹40 delivery!
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem' }}
              onClick={() => loadFixture(2)}
              data-testid="load-fixture-2-btn"
            >
              Load Fixture 2
            </button>
          </div>

          <div style={{ backgroundColor: '#FFF', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--green-deep)', marginBottom: '0.25rem' }}>
              Fixture 3: ₹500 Cart
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              2 Margherita Pizzas + 2 Extra Dips (₹500).<br />Both scenarios: Delivery ₹0 &bull; Total ₹500.
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem' }}
              onClick={() => loadFixture(3)}
              data-testid="load-fixture-3-btn"
            >
              Load Fixture 3
            </button>
          </div>

          <div style={{ backgroundColor: '#FFF', border: '1px solid var(--orange-border)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--orange-accent)', marginBottom: '0.25rem' }}>
              Fixture 4: ₹600 + WELCOME20
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              2 Family Combos + 2 Dips + WELCOME20.<br />Fixed: ₹100 discount vs Buggy: ₹120 discount!
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem' }}
              onClick={() => loadFixture(4)}
              data-testid="load-fixture-4-btn"
            >
              Load Fixture 4
            </button>
          </div>

          <div style={{ backgroundColor: '#FFF', border: '1px solid var(--orange-border)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--orange-accent)', marginBottom: '0.25rem' }}>
              Fixture 5: ₹99 Veg Burger
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              1 Veg Burger (₹99).<br />Fixed: Checkout allowed vs Buggy: Checkout blocked!
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem' }}
              onClick={() => loadFixture(5)}
              data-testid="load-fixture-5-btn"
            >
              Load Fixture 5
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/cart')}
            style={{ padding: '0.75rem 2rem' }}
          >
            <span>View Loaded Cart</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
