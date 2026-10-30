import React, { useState } from 'react';
import { Plus, Minus, Check, Utensils } from 'lucide-react';
import { Product } from '../types';
import { formatPaise } from '../utils/calc';
import { useCart } from '../context/CartContext';

interface FoodCardProps {
  product: Product;
}

export const FoodCard: React.FC<FoodCardProps> = ({ product }) => {
  const { getItemQuantity, addItem, incrementQuantity, decrementQuantity } = useCart();
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const quantity = getItemQuantity(product.id);

  const handleAdd = () => {
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="food-card" data-testid={`food-card-${product.id}`}>
      <div className="food-image-wrapper">
        {!imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="food-image"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EDE7DC',
              color: '#56685E',
              gap: '0.5rem',
            }}
          >
            <Utensils size={36} color="#2D6A4F" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{product.name}</span>
          </div>
        )}

        {product.badge && <span className="food-badge">{product.badge}</span>}
        {product.isVegetarian && (
          <div className="food-veg-tag" title="100% Vegetarian" aria-label="Vegetarian"></div>
        )}
      </div>

      <div className="food-content">
        <h3 className="food-title" data-testid={`food-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="food-description">{product.description}</p>

        <div className="food-footer">
          <div className="food-price" data-testid={`food-price-${product.id}`}>
            {formatPaise(product.pricePaise)}
          </div>

          <div>
            {quantity === 0 ? (
              <button
                type="button"
                className="btn-add"
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
                data-testid={`add-to-cart-${product.id}`}
              >
                {justAdded ? <Check size={16} /> : <Plus size={16} />}
                <span>{justAdded ? 'Added' : 'Add'}</span>
              </button>
            ) : (
              <div
                className="quantity-controller"
                role="group"
                aria-label={`Quantity selector for ${product.name}`}
              >
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => decrementQuantity(product.id)}
                  aria-label={`Decrease ${product.name} quantity`}
                  data-testid={`qty-decrease-${product.id}`}
                >
                  <Minus size={14} />
                </button>
                <span
                  className="qty-display"
                  aria-live="polite"
                  data-testid={`qty-value-${product.id}`}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => incrementQuantity(product.id)}
                  disabled={quantity >= 10}
                  aria-label={`Increase ${product.name} quantity`}
                  data-testid={`qty-increase-${product.id}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

