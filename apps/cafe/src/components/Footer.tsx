import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo-brand" style={{ color: '#FFF', marginBottom: '0.75rem' }}>
              <Coffee size={24} color="#FFC09F" />
              <span>Synapsee Café</span>
            </div>
            <p className="footer-text">
              Fictional demonstration restaurant created for the <strong>PromiseCheck</strong> hackathon project.
              Engineered with dual runtime scenarios (Fixed vs Buggy) to validate automated promise auditing by TinyFish.
            </p>
            <p className="footer-text" style={{ color: '#A3B8AC', fontSize: '0.8rem' }}>
              Built by <strong>Neha Ashok</strong> (Café Experience), Department of CSE, Presidency University, Bengaluru.
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/menu">Our Menu (5 Products)</Link>
              </li>
              <li>
                <Link to="/offers">Advertised Offers & Rules</Link>
              </li>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
              <li>
                <Link to="/checkout">Checkout Review</Link>
              </li>
              <li>
                <Link to="/demo-controls">Presenter Controls</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Project Synapsee</h4>
            <p className="footer-text">
              <strong>Team Leader:</strong> Jeevith P<br />
              <strong>QA & Validation:</strong> Likitha R<br />
              <strong>Café & Frontend:</strong> Neha Ashok
            </p>
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFC09F', fontWeight: 600 }}>
                <Shield size={16} />
                <span>Simulation Only</span>
              </div>
              <p style={{ marginTop: '0.25rem', color: '#D3DFD8' }}>
                All prices in INR paise. No payment gateway integration or real deliveries.
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} Synapsee Café &bull; Demonstration Restaurant for PromiseCheck &bull; Department of CSE, Presidency University
          </p>
        </div>
      </div>
    </footer>
  );
};
