import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { sdk } from '../lib/medusa-api';
import { trackBeginCheckout } from '../lib/analytics';
import AuthModal from '../components/AuthModal';
import '../styles/checkout.css';

function CheckoutPage() {
    const navigate = useNavigate();
    const { cartObj, loading: cartLoading, resetCart } = useCart();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedShippingOption, setSelectedShippingOption] = useState(null);
    const beginCheckoutTrackedCartId = useRef('');

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        country_code: 'in' // Default to India
    });

    // Check authentication and show modal if needed
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            setShowAuthModal(true);
        }
    }, [authLoading, isAuthenticated]);

    // Auto-fill form with user data
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    // Fetch shipping options once we have a cart
    useEffect(() => {
        if (cartObj?.id) {
            fetchShippingOptions();
        }
    }, [cartObj?.id]);

    useEffect(() => {
        if (!cartObj?.id || !(cartObj?.items || []).length || orderPlaced) {
            return;
        }

        if (beginCheckoutTrackedCartId.current === cartObj.id) {
            return;
        }

        trackBeginCheckout(cartObj);
        beginCheckoutTrackedCartId.current = cartObj.id;
    }, [cartObj?.id, cartObj?.items?.length, cartObj?.total, orderPlaced]);

    const fetchShippingOptions = async () => {
        try {
            const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
                cart_id: cartObj.id
            });
            const cartCurrency = (cartObj?.currency_code || "").toLowerCase();
            const regionId = cartObj?.region_id;

            const validOptions = (shipping_options || []).filter((option) => {
                if (option?.insufficient_inventory) {
                    return false;
                }

                const prices = option?.prices || [];
                return prices.some((price) => {
                    const currencyMatches =
                        (price?.currency_code || "").toLowerCase() === cartCurrency;
                    const regionMatches = (price?.price_rules || []).some(
                        (rule) =>
                            rule?.attribute === "region_id" &&
                            rule?.value === regionId
                    );
                    return currencyMatches || regionMatches;
                });
            });

            const dedupedOptions = Array.from(
                new Map(
                    validOptions.map((option) => [
                        `${option?.provider_id || "provider"}:${option?.type?.code || option?.name}`,
                        option,
                    ])
                ).values()
            );

            setShippingOptions(dedupedOptions);
            if (dedupedOptions.length > 0) {
                setSelectedShippingOption(dedupedOptions[0].id);
            } else {
                setSelectedShippingOption(null);
            }
        } catch (error) {
            console.error("Error fetching shipping options:", error);
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCheckoutError('');

        if (!isAuthenticated) {
            setCheckoutError('Please sign in to continue checkout.');
            setShowAuthModal(true);
            return;
        }

        if (!cartObj?.id) {
            setCheckoutError('Cart not found. Please refresh and try again.');
            return;
        }

        setProcessing(true);

        try {
            // 1. Update Cart with Email and Shipping Address
            let { cart: currentCart } = await sdk.store.cart.update(cartObj.id, {
                email: formData.email,
                shipping_address: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    address_1: formData.address,
                    city: formData.city,
                    province: formData.state,
                    postal_code: formData.pincode,
                    phone: formData.phone,
                    country_code: formData.country_code
                }
            });

            // 2. Add Shipping Method
            // Note: In Medusa V2, if you don't have shipping options configured, 
            // you might need to create one in the admin first.
            if (selectedShippingOption) {
                const { cart } = await sdk.store.cart.addShippingMethod(cartObj.id, {
                    option_id: selectedShippingOption
                });
                currentCart = cart;
            } else {
                throw new Error("No valid shipping option is available for this cart. Please refresh your cart.");
            }

            // 3. Create Payment Session
            // Using 'manual' provider for COD (built-in to Medusa)
            await sdk.store.payment.initiatePaymentSession(currentCart, {
                provider_id: "pp_system_default"
            });

            // 4. Complete Cart (Place Order)
            const response = await sdk.store.cart.complete(currentCart.id);

            if (response.type === "order") {
                setOrderPlaced(true);
                localStorage.removeItem("medusa_cart_id"); // Clear cart locally
                await resetCart();
            } else {
                throw new Error("Failed to complete order: " + (response.error || "Unknown error"));
            }

        } catch (error) {
            console.error("Checkout failed:", error);
            setCheckoutError(
                error?.response?.data?.message ||
                error?.cause?.message ||
                error?.message ||
                'Checkout failed. Please check your details and try again.'
            );
        } finally {
            setProcessing(false);
        }
    };

    if (cartLoading || authLoading) {
        return <div className="checkout-page"><div className="loading-spinner-large"></div></div>;
    }

    const items = cartObj?.items || [];

    if (items.length === 0 && !orderPlaced) {
        return (
            <div className="checkout-page empty">
                <div className="empty-checkout">
                    <h1>Your Cart is Empty</h1>
                    <p>Add products before checking out</p>
                    <button onClick={() => navigate('/products')} className="back-btn">
                        Go to Products
                    </button>
                </div>
            </div>
        );
    }

    if (orderPlaced) {
        return (
            <div className="checkout-page success">
                <div className="order-success">
                    <div className="success-icon">&#10003;</div>
                    <h1>Order Placed Successfully!</h1>
                    <p>Thank you for your order. We've received it and are processing it.</p>
                    <button onClick={() => navigate('/products')} className="continue-btn">
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    const price = (amount) => (amount || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: cartObj?.currency_code?.toUpperCase() || 'INR',
        minimumFractionDigits: 2
    });

    return (
        <div className="checkout-page">
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
            />

            <div className="checkout-container">
                <button className="back-button" onClick={() => navigate('/cart')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Back to Cart
                </button>

                <div className="checkout-content">
                    {/* Checkout Form */}
                    <div className="checkout-form">
                        <h1>Checkout</h1>

                        {isAuthenticated && user && (
                            <div className="user-info-banner">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M4 18c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span>Signed in as {user.first_name} {user.last_name} ({user.email})</span>
                            </div>
                        )}
                        {checkoutError && <p className="checkout-inline-error">{checkoutError}</p>}

                        <form onSubmit={handleSubmit}>
                            {/* Contact Information */}
                            <section className="form-section">
                                <h2>Contact Information</h2>
                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="you@example.com"
                                        readOnly={!!user}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone *</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                            </section>

                            {/* Shipping Address */}
                            <section className="form-section">
                                <h2>Shipping Address</h2>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="firstName">First Name *</label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastName">Last Name *</label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="address">Address *</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Street address"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="city">City *</label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="state">State *</label>
                                        <input
                                            type="text"
                                            id="state"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="pincode">Pincode *</label>
                                        <input
                                            type="text"
                                            id="pincode"
                                            name="pincode"
                                            value={formData.pincode}
                                            onChange={handleInputChange}
                                            required
                                            pattern="[0-9]{6}"
                                            placeholder="123456"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Shipping Methods */}
                            {shippingOptions.length > 0 && (
                                <section className="form-section">
                                    <h2>Shipping Method</h2>
                                    <div className="shipping-options">
                                        {shippingOptions.map(option => (
                                            <div
                                                key={option.id}
                                                className={`payment-option ${selectedShippingOption === option.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedShippingOption(option.id)}
                                            >
                                                <input
                                                    type="radio"
                                                    id={option.id}
                                                    name="shipping_method"
                                                    checked={selectedShippingOption === option.id}
                                                    onChange={() => setSelectedShippingOption(option.id)}
                                                />
                                                <label htmlFor={option.id}>
                                                    <strong>{option.name}</strong>
                                                    <span>{price(option.amount)}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Payment Method */}
                            <section className="form-section">
                                <h2>Payment Method</h2>
                                <div className="payment-option selected">
                                    <input type="radio" id="cod" name="payment" checked readOnly />
                                    <label htmlFor="cod">
                                        <strong>Cash on Delivery (COD)</strong>
                                        <span>Pay when you receive your order</span>
                                    </label>
                                </div>
                            </section>

                            <button
                                type="submit"
                                className="place-order-btn"
                                disabled={processing}
                            >
                                {processing ? <div className="loading-spinner"></div> : "Place Order (COD)"}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary">
                        <h2>Order Summary</h2>
                        <div className="summary-items">
                            {items.map((item) => (
                                <div key={item.id} className="summary-item">
                                    <div className="item-image-small">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.product_title} />
                                        ) : (
                                            <div className="no-image">?</div>
                                        )}
                                    </div>
                                    <div className="item-info">
                                        <p className="item-name">{item.product_title}</p>
                                        <p className="item-size">{item.variant_title}</p>
                                        <p className="item-qty">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="item-price">{price(item.unit_price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{price(cartObj?.subtotal || 0)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax</span>
                                <span>{price(cartObj?.tax_total || 0)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>{price(cartObj?.shipping_total || 0)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>{price(cartObj?.total || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
