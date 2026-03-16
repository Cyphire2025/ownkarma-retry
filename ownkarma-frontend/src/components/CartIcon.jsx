import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/cart-icon.css';

function CartIcon({ position = 'fixed' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { getCartCount } = useCart();
    const itemCount = getCartCount();

    return (
        <button
            className={`cart-icon-button ${position}`}
            onClick={() => navigate('/cart', { state: { from: `${location.pathname}${location.search}` } })}
            aria-label={`Shopping cart with ${itemCount} items`}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>

            {itemCount > 0 && (
                <span className="cart-badge">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </button>
    );
}

export default CartIcon;
