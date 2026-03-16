import React, { createContext, useContext, useState, useEffect } from 'react';
import { customersAPI } from '../lib/medusa-api';
import { trackLogin, trackSignUp } from '../lib/analytics';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const REMEMBER_KEY = 'ok_remember_me';
    const REMEMBER_UNTIL_KEY = 'ok_remember_until';
    const SESSION_KEY = 'ok_session_active';
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const rememberMe = localStorage.getItem(REMEMBER_KEY) === 'true';
            const rememberUntil = Number(localStorage.getItem(REMEMBER_UNTIL_KEY) || '0');
            const hasSession = sessionStorage.getItem(SESSION_KEY) === 'true';

            if (rememberMe && rememberUntil && Date.now() > rememberUntil) {
                await logout();
                localStorage.removeItem(REMEMBER_KEY);
                localStorage.removeItem(REMEMBER_UNTIL_KEY);
                sessionStorage.removeItem(SESSION_KEY);
                return;
            }

            if (!rememberMe && !hasSession) {
                await logout();
                return;
            }

            const response = await customersAPI.retrieve();
            if (response.success && response.customer) {
                setUser(response.customer);
                setIsAuthenticated(true);
                trackLogin('email');
            } else {
                await logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await customersAPI.login(email, password);
            if (response.success && response.customer) {
                setUser(response.customer);
                setIsAuthenticated(true);

                if (rememberMe) {
                    localStorage.setItem(REMEMBER_KEY, 'true');
                    localStorage.setItem(REMEMBER_UNTIL_KEY, String(Date.now() + THIRTY_DAYS_MS));
                    sessionStorage.removeItem(SESSION_KEY);
                } else {
                    localStorage.removeItem(REMEMBER_KEY);
                    localStorage.removeItem(REMEMBER_UNTIL_KEY);
                    sessionStorage.setItem(SESSION_KEY, 'true');
                }
                return { success: true };
            } else {
                return {
                    success: false,
                    message: response.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    };

    const signup = async (userData, rememberMe = false) => {
        try {
            const response = await customersAPI.create(userData);
            if (response.success && response.customer) {
                // After successful signup, log the user in immediately
                setUser(response.customer);
                setIsAuthenticated(true);
                trackSignUp('email');

                if (rememberMe) {
                    localStorage.setItem(REMEMBER_KEY, 'true');
                    localStorage.setItem(REMEMBER_UNTIL_KEY, String(Date.now() + THIRTY_DAYS_MS));
                    sessionStorage.removeItem(SESSION_KEY);
                } else {
                    localStorage.removeItem(REMEMBER_KEY);
                    localStorage.removeItem(REMEMBER_UNTIL_KEY);
                    sessionStorage.setItem(SESSION_KEY, 'true');
                }

                return { success: true, customer: response.customer };
            } else {
                return {
                    success: false,
                    message: response.message || 'Signup failed'
                };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                message: error.message || 'Signup failed'
            };
        }
    };

    const logout = async () => {
        try {
            await customersAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem(REMEMBER_KEY);
            localStorage.removeItem(REMEMBER_UNTIL_KEY);
            sessionStorage.removeItem(SESSION_KEY);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
