import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/cart.css';

function CartPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartObj, removeFromCart, updateQuantity, loading } = useCart();
    const CART_ORIGIN_KEY = 'ok_cart_origin';

    const items = cartObj?.items || [];

    useEffect(() => {
        const fromPath = location.state?.from;

        if (!fromPath) return;
        if (fromPath === '/cart' || fromPath === '/checkout') return;

        sessionStorage.setItem(CART_ORIGIN_KEY, fromPath);
    }, [location.state]);

    const handleBack = () => {
        const cartOrigin = sessionStorage.getItem(CART_ORIGIN_KEY);

        if (cartOrigin && cartOrigin !== '/cart' && cartOrigin !== '/checkout') {
            navigate(cartOrigin);
            return;
        }

        navigate('/products');
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="cart-page-empty">
                <div className="loading-spinner-large"></div>
            </div>
        )
    }

    if (!items.length) {
        return (
            <div className="cart-page-empty">
                <div className="empty-cart-container">
                    <div className="empty-cart-icon">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <path d="M8 8h6l9.68 53.18c.48 2.64 2.8 4.6 5.48 4.6h35.12c2.56 0 4.84-1.88 5.4-4.4L76 20H20"
                                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="32" cy="72" r="4" fill="currentColor" />
                            <circle cx="64" cy="72" r="4" fill="currentColor" />
                        </svg>
                    </div>
                    <h1>Your cart is empty</h1>
                    <p>Looks like you haven't added anything yet</p>
                    <button onClick={() => navigate('/')} className="continue-shopping-btn">
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    // Format money helper
    const formatMoney = (amount) => {
        return (amount).toLocaleString('en-IN', {
            style: 'currency',
            currency: cartObj?.currency_code?.toUpperCase() || 'INR'
        })
    }

    // In Medusa V2, amounts are often stored in decimal-less units (cents), need to divide by 100? 
    // Usually yes, SDK returns raw amounts. Let's assume standard behavior: divide by 100 for display if currency is decimal based.
    // For safety, let's just display as is assuming standard Medusa format or check currency.
    // Actually, modern Medusa setups often handle this. Let's assume input is 1000 = 10.00
    // We will divide by 100 for display.
    const price = (amount) => (amount).toLocaleString('en-IN', {
        style: 'currency',
        currency: cartObj?.currency_code?.toUpperCase() || 'INR',
        minimumFractionDigits: 2
    })

    return (
        <div className="cart-page">
            <div className="cart-container">
                {/* Back Button */}
                <button className="back-button" onClick={handleBack}>
                    {'< back'}
                </button>

                {/* Header */}
                <div className="cart-header">
                    <h1>Shopping Cart</h1>
                    <p className="item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
                </div>

                <div className="cart-content-grid">
                    {/* Cart Items */}
                    <div className="cart-items-section">
                        {items.map((item, index) => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-image">
                                    {(item.thumbnail) ? (
                                        <img
                                            src={item.thumbnail}
                                            alt={item.product_title}
                                            onError={(e) => { e.target.src = '/backgrounds/1.png' }}
                                        />
                                    ) : (
                                        <div className="no-image">?</div>
                                    )}
                                </div>

                                <div className="cart-item-details">
                                    <h3 className="cart-item-title">{item.product_title}</h3>
                                    <p className="cart-item-tagline">{item.variant_title}</p>
                                </div>

                                <div className="cart-item-quantity">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="qty-btn"
                                        disabled={item.quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span className="qty-display">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="qty-btn"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="cart-item-price">
                                    <p className="item-total">{price(item.unit_price * item.quantity)}</p>
                                    {item.quantity > 1 && (
                                        <p className="item-unit-price">{price(item.unit_price)} each</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="cart-item-remove"
                                    aria-label="Remove item"
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Cart Summary - Sticky */}
                    <div className="cart-summary-section">
                        <div className="cart-summary">
                            <h2>Order Summary</h2>

                            <div className="summary-details">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>{price(cartObj?.subtotal || 0)}</span>
                                </div>

                                <div className="summary-row">
                                    <span>Tax</span>
                                    <span>{price(cartObj?.tax_total || 0)}</span>
                                </div>

                                <div className="summary-row">
                                    <span>Discount</span>
                                    <span>{price(cartObj?.discount_total || 0)}</span>
                                </div>

                                <div className="summary-row">
                                    <span>Shipping</span>
                                    <span>{price(cartObj?.shipping_total || 0)}</span>
                                </div>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-total">
                                <span>Total</span>
                                <span className="total-amount">{price(cartObj?.total || 0)}</span>
                            </div>

                            <button onClick={handleCheckout} className="checkout-btn">
                                Proceed to Checkout
                            </button>

                            <button onClick={() => navigate('/products')} className="continue-shopping-link">
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CartPage;
