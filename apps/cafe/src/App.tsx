import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { OffersPage } from './pages/OffersPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DemoControlsPage } from './pages/DemoControlsPage';

export const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/demo-controls" element={<DemoControlsPage />} />
          {/* Fallback route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default App;

