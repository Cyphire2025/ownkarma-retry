import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { initGoogleAnalytics } from './lib/analytics.js'
import IntroPage from './pages/IntroPage.jsx'

import ProductsPage from './pages/ProductsPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import DivinePage from './pages/DivinePage.jsx'
import KarmaPage from './pages/KarmaPage.jsx'
import DestinyPage from './pages/DestinyPage.jsx'
import BrokenHourglassPage from './pages/BrokenHourglassPage.jsx'
import CollectionPage from './pages/CollectionPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import NotFoundPage from './components/ui/page-not-found'

const KNOWN_ROUTE_PATTERNS = [
    '/',
    '/products',
    '/product/:id',
    '/cart',
    '/checkout',
    '/divine',
    '/karma-eye',
    '/destiny',
    '/broken-hourglass',
    '/profile',
    '/collection/:slug',
    '/maintenance'
]

function AppContent({ isMaintenanceMode }) {
    const location = useLocation()
    const isKnownRoute = KNOWN_ROUTE_PATTERNS.some((pattern) =>
        matchPath({ path: pattern, end: true }, location.pathname)
    )
    const useBlackLogo = isMaintenanceMode || location.pathname === '/maintenance' || !isKnownRoute

    return (
        <>
            {/* GLOBAL LOGO */}
            <a href="/" style={{
                position: 'fixed',
                top: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                display: 'block',
                cursor: 'pointer',
                opacity: 0.9
            }}>
                <img
                    src="/backgrounds/website-logo.png"
                    alt="OWN KARMA"
                    style={{
                        height: '40px', // Adjusted height for elegance
                        width: 'auto',
                        objectFit: 'contain',
                        filter: useBlackLogo ? 'brightness(0)' : 'none'
                    }}
                />
            </a>
            <Routes>
                {isMaintenanceMode ? (
                    <Route path="*" element={<NotFoundPage mode="maintenance" />} />
                ) : (
                    <>
                        <Route path="/" element={<IntroPage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/product/:id" element={<ProductDetailPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/divine" element={<DivinePage />} />
                        <Route path="/karma-eye" element={<KarmaPage />} />
                        <Route path="/destiny" element={<DestinyPage />} />
                        <Route path="/broken-hourglass" element={<BrokenHourglassPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/collection/:slug" element={<CollectionPage />} />
                        <Route path="/maintenance" element={<NotFoundPage mode="maintenance" />} />
                        <Route path="*" element={<NotFoundPage mode="not-found" />} />
                    </>
                )}
            </Routes>
        </>
    )
}

function App() {
    const maintenanceFlag = `${import.meta.env.VITE_MAINTENANCE_MODE ?? '0'}`.trim()
    const isMaintenanceMode = maintenanceFlag === '1'

    useEffect(() => {
        initGoogleAnalytics()
    }, [])

    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <AppContent isMaintenanceMode={isMaintenanceMode} />
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    )
}

export default App
