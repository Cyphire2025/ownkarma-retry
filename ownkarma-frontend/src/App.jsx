import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { initGoogleAnalytics } from './lib/analytics.js'
import IntroPage, { STAGES as INTRO_STAGES } from './pages/IntroPage.jsx'
import { preloadImage } from './utils/ImageSequence.js'

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

const PRELOAD_CONCURRENCY = 18

function buildIntroFrameUrls() {
    const urls = []

    for (const stage of INTRO_STAGES) {
        const extension = stage.format || '.webp'
        const frameStep = stage.frameStep || 1
        for (let i = 0; i < stage.frames; i += frameStep) {
            const frameId = i.toString().padStart(4, '0')
            urls.push(`${stage.folder}/frame_${frameId}${extension}`)
        }
    }

    return urls
}

async function preloadFrameUrls(urls, onProgress) {
    const total = urls.length
    let loaded = 0
    let cursor = 0
    const loadTimeoutMs = 15000

    const worker = async () => {
        while (true) {
            const currentIndex = cursor
            cursor += 1

            if (currentIndex >= total) {
                return
            }

            try {
                await Promise.race([
                    preloadImage(urls[currentIndex]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), loadTimeoutMs))
                ])
            } catch (_err) {
                // Continue loading remaining assets even if one frame fails.
            }

            loaded += 1
            onProgress(loaded, total)
        }
    }

    await Promise.all(Array.from({ length: PRELOAD_CONCURRENCY }, worker))
}

function AppLoadingScreen({ progress }) {
    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            background: 'radial-gradient(circle at 50% 20%, #1b1b1b 0%, #050505 55%, #000000 100%)',
            color: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "'Inter', sans-serif",
            padding: '2rem'
        }}>
            <img
                src="/backgrounds/website-logo.png"
                alt="OWN KARMA"
                style={{ height: '50px', width: 'auto', marginBottom: '1.75rem', opacity: 0.95 }}
            />
            <div style={{
                width: 'min(520px, 88vw)',
                height: '9px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.14)',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #b6b6b6 0%, #ffffff 65%, #d9d9d9 100%)',
                    transition: 'width 120ms linear'
                }} />
            </div>
            <p style={{ marginTop: '0.85rem', fontSize: '0.95rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Loading {progress}%
            </p>
        </div>
    )
}

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
    const frameUrls = useMemo(() => buildIntroFrameUrls(), [])
    const [isPreloadComplete, setIsPreloadComplete] = useState(isMaintenanceMode)
    const [loadingProgress, setLoadingProgress] = useState(0)

    useEffect(() => {
        initGoogleAnalytics()
    }, [])

    useEffect(() => {
        if (isMaintenanceMode) return
        let cancelled = false

        preloadFrameUrls(frameUrls, (loaded, total) => {
            if (cancelled) return
            setLoadingProgress(Math.min(100, Math.round((loaded / total) * 100)))
        }).finally(() => {
            if (!cancelled) {
                setLoadingProgress(100)
                setIsPreloadComplete(true)
            }
        })

        return () => {
            cancelled = true
        }
    }, [isMaintenanceMode, frameUrls])

    if (!isPreloadComplete) {
        return <AppLoadingScreen progress={loadingProgress} />
    }

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
