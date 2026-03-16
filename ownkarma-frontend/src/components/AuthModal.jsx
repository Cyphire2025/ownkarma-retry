import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth-modal.css';

function AuthModal({ isOpen, onClose, onSuccess }) {
    const { login, signup } = useAuth();
    const [mode, setMode] = useState('signup'); // 'login' or 'signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error on input change
        setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.email || !formData.password) {
            if (!formData.email) errors.email = 'Email is required';
            if (!formData.password) errors.password = 'Password is required';
        }

        if (mode === 'signup') {
            if (!formData.first_name || !formData.last_name) {
                if (!formData.first_name) errors.first_name = 'First name is required';
                if (!formData.last_name) errors.last_name = 'Last name is required';
            }
            if (formData.password && formData.password.length < 6) {
                errors.password = 'Password must be at least 6 characters';
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setError('Please fix the highlighted fields');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            let response;
            if (mode === 'login') {
                response = await login(formData.email, formData.password, rememberMe);
            } else {
                response = await signup(formData, rememberMe);
            }

            if (response.success) {
                // Reset form
                setFormData({
                    email: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    phone: ''
                });
                setRememberMe(false);
                setFieldErrors({});
                setShowPassword(false);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                setError(response.message || 'An error occurred');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setError('');
        setFieldErrors({});
        setShowPassword(false);
        setFormData({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            phone: ''
        });
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="auth-modal-close" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="auth-modal-content">
                    <h2 className="auth-modal-title">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="auth-modal-subtitle">
                    {mode === 'login'
                            ? 'Sign in to continue your journey'
                            : 'Join us and start building your own karma'}
                    </p>

                    {error && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 4V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {mode === 'signup' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="John"
                                        aria-invalid={!!fieldErrors.first_name}
                                    />
                                    {fieldErrors.first_name && <p className="field-error">{fieldErrors.first_name}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        aria-invalid={!!fieldErrors.last_name}
                                    />
                                    {fieldErrors.last_name && <p className="field-error">{fieldErrors.last_name}</p>}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                autoComplete={mode === 'login' ? 'username' : 'email'}
                                aria-invalid={!!fieldErrors.email}
                            />
                            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                        </div>

                        {mode === 'signup' && (
                            <div className="form-group">
                                <label>Phone (Optional)</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Password *</label>
                            <div className="password-input-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    aria-invalid={!!fieldErrors.password}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
                        </div>

                        <label className="remember-row">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember me for 30 days</span>
                        </label>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                mode === 'login' ? 'Sign In' : 'Create Account'
                            )}
                        </button>

                        {/* Google Sign-In Placeholder */}
                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <button type="button" className="google-signin-btn" disabled>
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                            </svg>
                            <span>Continue with Google (Coming Soon)</span>
                        </button>
                    </form>

                    <div className="auth-switch">
                        <span>
                            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                        </span>
                        <button onClick={switchMode} className="auth-switch-btn">
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;

