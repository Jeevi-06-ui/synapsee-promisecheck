import React, { useState } from 'react';
import { PRODUCT_LIST } from '../data/products';
import { FoodCard } from '../components/FoodCard';
import { Utensils } from 'lucide-react';

type CategoryFilter = 'all' | 'mains' | 'combos' | 'sides';

export const MenuPage: React.FC = () => {
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const filteredProducts =
    filter === 'all'
      ? PRODUCT_LIST
      : PRODUCT_LIST.filter((p) => p.category === filter);

  return (
    <div className="container">
      <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
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
          <Utensils size={16} />
          <span>Handcrafted Selection</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            color: 'var(--green-deep)',
            marginBottom: '0.75rem',
          }}
        >
          Our Delicious Menu
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>
          All 5 menu items freshly made to order. Prices include all applicable taxes for this demonstration store. Extra Dip is selectable alongside all mains and combos.
        </p>

        {/* Filter Pills */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: '#EDE7DC',
            padding: '0.35rem',
            borderRadius: '9999px',
            marginTop: '1.5rem',
            gap: '0.25rem',
          }}
          role="tablist"
          aria-label="Filter menu items"
        >
          {(
            [
              { id: 'all', label: 'All Items (5)' },
              { id: 'mains', label: 'Mains (3)' },
              { id: 'combos', label: 'Combos (1)' },
              { id: 'sides', label: 'Sides & Dips (1)' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={filter === cat.id}
              onClick={() => setFilter(cat.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: filter === cat.id ? '#FFF' : 'var(--green-forest)',
                backgroundColor: filter === cat.id ? 'var(--green-deep)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="food-grid" data-testid="menu-product-list">
        {filteredProducts.map((product) => (
          <FoodCard key={product.id} product={product} />
        ))}
      </div>

      <div
        style={{
          marginTop: '3.5rem',
          padding: '1.5rem',
          backgroundColor: '#FFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        <span>💡 Quantity limit per item is 1 to 10. To test threshold values (like ₹499 or ₹200), add the desired combinations of mains and dips.</span>
      </div>
    </div>
  );
};
