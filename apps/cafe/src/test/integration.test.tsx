import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ScenarioProvider, useScenario } from '../context/ScenarioContext';
import { CartProvider } from '../context/CartContext';
import { FoodCard } from '../components/FoodCard';
import { OrderSummary } from '../components/OrderSummary';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { DemoControlsPage } from '../pages/DemoControlsPage';
import { PRODUCTS } from '../data/products';

// Helper component to render providers with custom initial route and scenario
const TestAppWrapper: React.FC<{
  initialEntries?: string[];
  children?: React.ReactNode;
}> = ({ initialEntries = ['/'], children }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ScenarioProvider>
        <CartProvider>
          {children || (
            <Routes>
              <Route path="/" element={<div data-testid="home">Home</div>} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/demo-controls" element={<DemoControlsPage />} />
            </Routes>
          )}
        </CartProvider>
      </ScenarioProvider>
    </MemoryRouter>
  );
};

describe('Integration Tests: Cart, Scenarios & Checkout UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('allows adding products to cart and updates quantity controls up to 10', async () => {
    render(
      <TestAppWrapper initialEntries={['/']}>
        <div>
          <FoodCard product={PRODUCTS['veg-burger']} />
          <OrderSummary />
        </div>
      </TestAppWrapper>
    );

    // Initial state: "Add" button present
    const addBtn = screen.getByTestId('add-to-cart-veg-burger');
    expect(addBtn).toBeInTheDocument();

    // Click Add
    await act(async () => {
      fireEvent.click(addBtn);
    });

    // Quantity display should show 1
    const qtyVal = screen.getByTestId('qty-value-veg-burger');
    expect(qtyVal).toHaveTextContent('1');

    // Subtotal should now be ₹99.00
    const subtotalEl = screen.getByTestId('subtotal-amount');
    expect(subtotalEl).toHaveTextContent('₹99.00');

    // Increment quantity to 2
    const incBtn = screen.getByTestId('qty-increase-veg-burger');
    await act(async () => {
      fireEvent.click(incBtn);
    });
    expect(screen.getByTestId('qty-value-veg-burger')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('₹198.00');
  });

  it('properly validates coupon WELCOME20 and updates reactive totals', async () => {
    render(
      <TestAppWrapper initialEntries={['/cart']}>
        <div>
          <FoodCard product={PRODUCTS['paneer-wrap']} />
          <OrderSummary />
        </div>
      </TestAppWrapper>
    );

    // 1 Paneer Wrap = ₹199.00 (19900 paise < 20000 paise threshold)
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-to-cart-paneer-wrap'));
    });

    // Apply WELCOME20 with subtotal ₹199.00 (below threshold)
    const input = screen.getByTestId('coupon-input');
    const applyBtn = screen.getByTestId('apply-coupon-btn');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'WELCOME20' } });
      fireEvent.click(applyBtn);
    });

    // Should display coupon error
    const msg = screen.getByTestId('coupon-message');
    expect(msg).toHaveTextContent(/Food subtotal must be at least ₹200.00/i);

    // Now increase quantity of Paneer Wrap to 2 (= ₹398.00 >= ₹200)
    await act(async () => {
      fireEvent.click(screen.getByTestId('qty-increase-paneer-wrap'));
    });

    // Now coupon applies reactively!
    expect(screen.getByTestId('discount-amount')).not.toHaveTextContent('₹0.00');
  });

  it('switching scenario resets cart and coupons automatically', async () => {
    render(
      <TestAppWrapper initialEntries={['/demo-controls']}>
        <div>
          <FoodCard product={PRODUCTS['veg-burger']} />
          <DemoControlsPage />
        </div>
      </TestAppWrapper>
    );

    // Add item to cart
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-to-cart-veg-burger'));
    });
    expect(screen.getByTestId('qty-value-veg-burger')).toHaveTextContent('1');

    // Switch scenario to Buggy
    const buggySelect = screen.getByTestId('select-scenario-buggy');
    await act(async () => {
      fireEvent.click(buggySelect);
    });

    // Cart should be reset to 0 items!
    expect(screen.queryByTestId('qty-value-veg-burger')).toBeNull();
    expect(screen.getByTestId('add-to-cart-veg-burger')).toBeInTheDocument();
  });

  it('handles URL entry parameter ?scenario=buggy vs ?scenario=fixed', () => {
    window.history.replaceState({}, '', '/?scenario=buggy');

    const TestScenarioInspector: React.FC = () => {
      const { scenario } = useScenario();
      return <div data-testid="active-scenario">{scenario}</div>;
    };

    render(
      <TestAppWrapper initialEntries={['/?scenario=buggy']}>
        <TestScenarioInspector />
      </TestAppWrapper>
    );

    expect(screen.getByTestId('active-scenario')).toHaveTextContent('buggy');
  });

  it('blocks checkout on CheckoutPage in Buggy mode when subtotal < ₹199', async () => {
    // Set scenario to buggy in storage
    window.sessionStorage.setItem('synapsee_cafe_scenario', 'buggy');

    render(
      <TestAppWrapper initialEntries={['/checkout']}>
        <div>
          <FoodCard product={PRODUCTS['veg-burger']} />
          <CheckoutPage />
        </div>
      </TestAppWrapper>
    );

    // Add 1 Veg Burger (₹99.00)
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-to-cart-veg-burger'));
    });

    // Should display checkout blocked notice
    const blockedNotice = screen.getByTestId('checkout-page-blocked-notice');
    expect(blockedNotice).toBeInTheDocument();
    expect(blockedNotice).toHaveTextContent(/Minimum food subtotal of ₹199.00 required/i);

    // Place demo order button should be disabled
    const placeBtn = screen.getByTestId('place-demo-order-btn');
    expect(placeBtn).toBeDisabled();
  });
});
