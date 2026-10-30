import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Flame } from 'lucide-react';
import { PRODUCT_LIST } from '../data/products';
import { FoodCard } from '../components/FoodCard';
import { useScenario } from '../context/ScenarioContext';

export const HomePage: React.FC = () => {
  const { scenario } = useScenario();

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #163829 0%, #21513B 100%)',
          color: '#FFF',
          padding: '4rem 0 5rem',
          borderRadius: '0 0 2rem 2rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '3rem',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '720px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(4px)',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                color: '#FFC09F',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={16} />
              <span>Synapsee Café &bull; Demonstration Restaurant for PromiseCheck</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '1.25rem',
              }}
            >
              Fresh Artisan Bites. Honest Promises.
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.6,
                color: '#D8E8DE',
                marginBottom: '2rem',
              }}
            >
              Welcome to Synapsee Café, crafted for the PromiseCheck hackathon project. Experience our wood-fired pizzas, hearty wraps, and chef-curated combos with crystal-clear pricing.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/menu" className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
                <span>Explore Full Menu</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/offers"
                className="btn-secondary"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFF',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  padding: '0.85rem 1.75rem',
                }}
              >
                <span>View Advertised Offers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Prominent Offers Banner */}
        <section
          style={{
            backgroundColor: '#FFF',
            border: '2px solid var(--orange-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '3.5rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
          data-testid="home-offers-banner"
        >
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--orange-accent)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              <Flame size={16} />
              <span>Special Hackathon Offers</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--green-deep)', marginBottom: '0.5rem' }}>
              Free Delivery & 20% Off Welcome Promo
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Enjoy <strong>FREE delivery</strong> on food orders ₹499+ (normally ₹40), plus <strong>20% discount</strong> with promo code <strong>WELCOME20</strong> (Min ₹200 order, Max ₹100 discount).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/offers" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              View Offer Details
            </Link>
            <Link to="/menu" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Order Now
            </Link>
          </div>
        </section>

        {/* Featured Items Section */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ color: 'var(--green-leaf)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Handpicked Favourites
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--green-deep)', marginTop: '0.25rem' }}>
                Featured Menu Items
              </h2>
            </div>
            <Link to="/menu" style={{ color: 'var(--green-forest)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>View all 5 items</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="food-grid">
            {PRODUCT_LIST.slice(0, 4).map((product) => (
              <FoodCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Extra Dip Spotlight */}
        <section
          style={{
            backgroundColor: '#F5EFE3',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '580px' }}>
            <span style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-forest)', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Everyday Essential &bull; ₹1.00
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--green-deep)', margin: '0.65rem 0' }}>
              Need That Extra Zing? Add Extra Dip for just ₹1!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Extra Dip is an ordinary visible item on our menu for only 100 paise (₹1.00). It helps you fine-tune your cart value to test exact discount and free delivery thresholds!
            </p>
          </div>
          <div style={{ minWidth: '240px' }}>
            <FoodCard product={PRODUCT_LIST[4]} />
          </div>
        </section>

        {/* Presenter / Hackathon Transparency Callout */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px dashed var(--green-leaf)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: 'var(--green-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--green-forest)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--green-deep)', marginBottom: '0.5rem' }}>
                Testing PromiseCheck with Dual Scenarios
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                This café is designed for automated validation by TinyFish in our companion application <strong>PromiseCheck</strong>. Currently active scenario: <strong>{scenario.toUpperCase()}</strong>.
                You can switch between <em>Fixed</em> (rule-compliant) and <em>Buggy</em> (contains 3 deliberate defects) at any time.
              </p>
              <Link to="/demo-controls" className="btn-secondary">
                <span>Open Presenter & Scenario Controls</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
