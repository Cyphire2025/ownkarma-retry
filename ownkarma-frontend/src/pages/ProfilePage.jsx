import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customersAPI, ordersAPI } from '../lib/medusa-api';
import '../styles/profile-modern.css';
import gsap from 'gsap';

function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, orders, settings
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: ''
    });
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        } else if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || ''
            });
        }
    }, [user, loading, navigate]);

    // Animate content on tab change
    useEffect(() => {
        gsap.fromTo('.profile-content-area',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
    }, [activeTab]);

    useEffect(() => {
        if (!user) return;
        if (activeTab !== 'orders' && activeTab !== 'overview') return;

        let isActive = true;

        const fetchOrders = async () => {
            setOrdersLoading(true);
            setOrdersError('');
            const res = await ordersAPI.list();

            if (!isActive) return;

            if (res.success) {
                setOrders(res.orders || []);
            } else {
                setOrders([]);
                setOrdersError(res.message || 'Failed to fetch orders');
            }
            setOrdersLoading(false);
        };

        fetchOrders();

        return () => {
            isActive = false;
        };
    }, [activeTab, user]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const [statusData, setStatusData] = useState({ type: '', msg: '' });

    const formatCurrency = (amount, currencyCode = 'inr') => {
        const normalizedCurrency = (currencyCode || 'inr').toUpperCase();
        const numericAmount = Number(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: normalizedCurrency
        }).format(Number.isNaN(numericAmount) ? 0 : numericAmount);
    };

    const formatOrderDate = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOrderTracking = (order) => {
        const fulfillments = order?.fulfillments || [];
        return fulfillments.flatMap((fulfillment) => fulfillment?.tracking_links || []);
    };

    const humanizeStatus = (value, fallback = 'pending') => {
        const raw = (value || fallback).toString().replace(/_/g, ' ');
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setStatusData({ type: 'loading', msg: 'Updating...' });
        try {
            const res = await customersAPI.update({
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone
            });

            if (res.success) {
                setStatusData({ type: 'success', msg: 'Profile updated.' });
                setIsEditing(false);
                setTimeout(() => setStatusData({ type: '', msg: '' }), 3000);
            } else {
                setStatusData({ type: 'error', msg: res.message || 'Update failed' });
            }
        } catch (error) {
            console.error(error);
            setStatusData({ type: 'error', msg: 'An unexpected error occurred' });
        }
    };

    if (loading) return null;

    return (
        <div className="modern-profile-page">
            <div className="profile-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <div className="glass-container">
                {/* Sidebar */}
                <aside className="profile-sidebar">
                    <div className="user-brief">
                        <div className="user-avatar">
                            {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="user-name-brief">
                            <h3>{user?.first_name} {user?.last_name}</h3>
                            <p>{user?.email}</p>
                        </div>
                    </div>

                    <nav className="profile-nav">
                        <button
                            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            Overview
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                            Orders
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            Settings
                        </button>
                    </nav>

                    <div className="sidebar-footer">
                        <button onClick={() => navigate('/')} className="back-link">
                            &larr; Back to Shop
                        </button>
                        <button onClick={handleLogout} className="logout-link">
                            Log out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="profile-content-area">
                    {activeTab === 'overview' && (
                        <div className="tab-content">
                            <h2 className="tab-title">Welcome back, {user?.first_name || 'Traveler'}</h2>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-label">Total Orders</span>
                                    <span className="stat-value">{orders.length}</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Member Since</span>
                                    <span className="stat-value">{new Date(user?.created_at || Date.now()).getFullYear()}</span>
                                </div>
                                <div className="stat-card highlight">
                                    <span className="stat-label">Karma Status</span>
                                    <span className="stat-value">Initiate</span>
                                </div>
                            </div>

                            <div className="recent-activity">
                                <h3>Recent Activity</h3>
                                <div className="activity-placeholder">
                                    {ordersLoading ? (
                                        <p>Loading activity...</p>
                                    ) : orders.length > 0 ? (
                                        <p>Latest order #{orders[0]?.display_id || orders[0]?.id} placed on {formatOrderDate(orders[0]?.created_at)}.</p>
                                    ) : (
                                        <p>Your journey has just begun. No recent activity to display.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="tab-content">
                            <h2 className="tab-title">Order History</h2>
                            <div className="orders-wrapper">
                                {ordersLoading ? (
                                    <div className="empty-state">
                                        <p>Loading your orders...</p>
                                    </div>
                                ) : ordersError ? (
                                    <div className="empty-state">
                                        <p>{ordersError}</p>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="empty-state">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line></svg>
                                        <p>No orders found in this timeline.</p>
                                        <button onClick={() => navigate('/products')} className="browse-btn">Browse Collection</button>
                                    </div>
                                ) : (
                                    <div className="orders-list-modern">
                                        {orders.map((order) => {
                                            const trackingLinks = getOrderTracking(order);
                                            const orderCode = order?.display_id ? `#${order.display_id}` : order?.id;
                                            const itemCount = (order?.items || []).reduce((acc, item) => acc + (item?.quantity || 0), 0);
                                            const shippingAddress = order?.shipping_address;
                                            return (
                                                <article key={order.id} className="order-card-modern">
                                                    <div className="order-card-head">
                                                        <div>
                                                            <p className="order-code">{orderCode}</p>
                                                            <p className="order-date">{formatOrderDate(order.created_at)}</p>
                                                        </div>
                                                        <div className="order-total">{formatCurrency(order.total, order.currency_code)}</div>
                                                    </div>

                                                    <div className="order-status-row">
                                                        <span className="order-pill">Order: {humanizeStatus(order.status)}</span>
                                                        <span className="order-pill">Payment: {humanizeStatus(order.payment_status)}</span>
                                                        <span className="order-pill">Fulfillment: {humanizeStatus(order.fulfillment_status, 'not_fulfilled')}</span>
                                                    </div>

                                                    <div className="order-items-list">
                                                        {(order?.items || []).map((item) => (
                                                            <div className="order-item-row" key={item.id}>
                                                                <div className="order-item-main">
                                                                    <p className="order-item-title">{item.product_title || item.title}</p>
                                                                    <p className="order-item-sub">
                                                                        {item.variant_title || 'Standard'} x {item.quantity || 0}
                                                                    </p>
                                                                </div>
                                                                <div className="order-item-total">
                                                                    {formatCurrency((item.unit_price || 0) * (item.quantity || 0), order.currency_code)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="order-summary-grid">
                                                        <div><span>Items</span><strong>{formatCurrency(order.subtotal, order.currency_code)}</strong></div>
                                                        <div><span>Shipping</span><strong>{formatCurrency(order.shipping_total, order.currency_code)}</strong></div>
                                                        <div><span>Tax</span><strong>{formatCurrency(order.tax_total, order.currency_code)}</strong></div>
                                                        <div><span>Discount</span><strong>- {formatCurrency(order.discount_total, order.currency_code)}</strong></div>
                                                    </div>

                                                    <div className="order-meta-row">
                                                        <span>{itemCount} item{itemCount === 1 ? '' : 's'}</span>
                                                        {shippingAddress?.city || shippingAddress?.country_code ? (
                                                            <span>
                                                                Ship to: {[shippingAddress?.city, shippingAddress?.country_code?.toUpperCase()].filter(Boolean).join(', ')}
                                                            </span>
                                                        ) : (
                                                            <span>No shipping address on record</span>
                                                        )}
                                                    </div>

                                                    {trackingLinks.length > 0 ? (
                                                        <div className="tracking-list">
                                                            {trackingLinks.map((tracking, idx) => (
                                                                <div className="tracking-row" key={`${tracking?.id || 'track'}-${idx}`}>
                                                                    <span>{tracking?.tracking_number ? `Tracking #: ${tracking.tracking_number}` : 'Tracking link available'}</span>
                                                                    {tracking?.url && (
                                                                        <a
                                                                            href={tracking.url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="track-link"
                                                                        >
                                                                            Track Shipment
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="tracking-muted">Tracking not available yet.</p>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="tab-content">
                            <h2 className="tab-title">Account Settings</h2>
                            <div className="settings-card">
                                <div className="card-header">
                                    <h3>Personal Details</h3>
                                    {!isEditing && <button onClick={() => setIsEditing(true)} className="edit-link">Edit</button>}
                                </div>
                                <form className="settings-form" onSubmit={handleUpdate}>
                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>First Name</label>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Email Address</label>
                                        <input type="email" value={user?.email} disabled className="readonly" />
                                    </div>
                                    <div className="input-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder="Add phone number"
                                        />
                                    </div>
                                    {statusData.msg && <p className={`status-msg ${statusData.type}`}>{statusData.msg}</p>}
                                    {isEditing && (
                                        <div className="form-actions">
                                            <button type="submit" className="save-btn">Save Changes</button>
                                            <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default ProfilePage;
