import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Coffee, ShoppingBag, Menu, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useScenario } from '../context/ScenarioContext';

export const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const { scenario } = useScenario();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <div className="fictional-banner" role="banner">
        <span>⚠️ Fictional Demonstration Store for PromiseCheck Hackathon — No real payments or orders.</span>
        <Link to="/demo-controls" onClick={closeMobileMenu}>
          Scenario: <strong>{scenario === 'buggy' ? 'Buggy (3 deliberate defects)' : 'Fixed (Rule-compliant)'}</strong>
        </Link>
      </div>

      <header className="header-nav">
        <div className="header-container">
          <Link to="/" className="logo-brand" onClick={closeMobileMenu} aria-label="Synapsee Café Home">
            <div className="logo-icon" aria-hidden="true">
              <Coffee size={22} />
            </div>
            <span>Synapsee Café</span>
          </Link>

          <nav aria-label="Main Navigation">
            <ul className="nav-links">
              <li className="nav-item">
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/menu" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Menu
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/offers" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Offers & Rules
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Cart
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/checkout" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Checkout
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/demo-controls" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Demo Controls
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            <Link
              to="/demo-controls"
              className={`scenario-pill ${scenario}`}
              title="Presenter Scenario Indicator - Click to configure"
              aria-label={`Current scenario: ${scenario}`}
            >
              {scenario === 'buggy' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
              <span>{scenario}</span>
            </Link>

            <Link
              to="/cart"
              className="cart-nav-btn"
              aria-label={`Shopping Cart, ${itemCount} items`}
              data-testid="nav-cart-btn"
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              <span className="cart-count-badge" data-testid="cart-badge-count">
                {itemCount}
              </span>
            </Link>

            <button
              className="mobile-toggle-btn"
              style={{ display: 'none', padding: '0.5rem' }}
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu" style={{ padding: '1rem', background: '#FFF', borderBottom: '1px solid #E8E2D5' }}>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link to="/" onClick={closeMobileMenu}>Home</Link>
              </li>
              <li>
                <Link to="/menu" onClick={closeMobileMenu}>Menu</Link>
              </li>
              <li>
                <Link to="/offers" onClick={closeMobileMenu}>Offers & Rules</Link>
              </li>
              <li>
                <Link to="/cart" onClick={closeMobileMenu}>Cart ({itemCount})</Link>
              </li>
              <li>
                <Link to="/checkout" onClick={closeMobileMenu}>Checkout</Link>
              </li>
              <li>
                <Link to="/demo-controls" onClick={closeMobileMenu}>Presenter Controls</Link>
              </li>
            </ul>
          </div>
        )}
      </header>
    </>
  );
};
