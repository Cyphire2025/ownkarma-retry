import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { categoriesAPI } from '../lib/api'
import ProductsSection from '../components/ProductsSection'
import '../styles/divine.css'

function CollectionPage() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [pageData, setPageData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        window.scrollTo(0, 0)
        const fetchPageData = async () => {
            try {
                const cats = await categoriesAPI.getAll()
                const match = cats.find(c => c.name.toLowerCase().trim().replace(/\s+/g, '-') === slug)
                if (match) {
                    setPageData(match)
                }
            } catch (err) {
                console.error("Failed to fetch collection data", err)
            } finally {
                setLoading(false)
            }
        }
        fetchPageData()
    }, [slug])

    if (loading) return (
        <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
    )

    if (!pageData) return (
        <div style={{ background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 'black' }}>404</h1>
            <p style={{ opacity: 0.5 }}>Collection not found</p>
            <button onClick={() => navigate('/')} style={{ marginTop: '2rem', background: '#fff', color: '#000', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 'bold' }}>Return Home</button>
        </div>
    )

    const hexToRgb = (hex) => {
        if (!hex) return '255, 255, 255';
        let r, g, b;
        let h = hex.replace('#', '');
        if (h.length === 3) {
            r = parseInt(h[0] + h[0], 16);
            g = parseInt(h[1] + h[1], 16);
            b = parseInt(h[2] + h[2], 16);
        } else if (h.length === 6) {
            r = parseInt(h.substring(0, 2), 16);
            g = parseInt(h.substring(2, 4), 16);
            b = parseInt(h.substring(4, 6), 16);
        } else return '255, 255, 255';
        return `${r}, ${g}, ${b}`;
    }

    const accentColor = pageData.color || '#ffffff'
    const rgb = hexToRgb(accentColor)

    return (
        <div className="divine-page-scroll">
            {/* Back Button */}
            <button className="back-button" onClick={() => navigate('/')}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>BACK</span>
            </button>

            {/* Hero Section */}
            <section className="video-section">
                {pageData.image ? (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${pageData.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(0.5)'
                    }} />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, background: '#111' }} />
                )}

                {/* Glow Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at center, rgba(${rgb}, 0.1) 0%, transparent 70%)`,
                    zIndex: 2
                }} />

                {/* Header */}
                <header className="divine-header" style={{ bottom: '10%' }}>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 8vw, 5rem)',
                        fontWeight: '900',
                        letterSpacing: '0.4em',
                        textShadow: `0 0 30px rgba(${rgb}, 0.3)`
                    }}>
                        {pageData.name.toUpperCase()}
                    </h1>
                    <p style={{ fontSize: '0.8rem', letterSpacing: '0.5em', marginTop: '1rem' }}>
                        {pageData.description || 'A NEW CHAPTER IN CONSCIOUSNESS'}
                    </p>
                </header>

                <div className="cloud-transition"></div>
            </section>

            {/* Philosophy Section */}
            <section className="content-section ideation-section">
                <div className="content-container">
                    <div className="content-text">
                        <span className="section-label" style={{ color: accentColor }}>PHILOSOPHY</span>
                        <h2>Embodying the essence of {pageData.name.toLowerCase()}.</h2>
                        <p>
                            Inspired by the eternal quest for balance, <strong style={{ color: accentColor }}>{pageData.name}</strong> represents
                            the convergence of intentionality and craftsmanship. Every detail is a reflection of the
                            Owner's journey toward self-realization.
                        </p>
                    </div>
                    <div className="content-image">
                        <div className="image-placeholder">
                            <img src={pageData.image || "/backgrounds/1.png"} alt={pageData.name} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Experience Section */}
            <section className="content-section engineering-section">
                <div className="content-container reverse">
                    <div className="content-image">
                        <div className="image-placeholder">
                            <img src={pageData.image || "/backgrounds/2.png"} alt={`${pageData.name} detail`} />
                        </div>
                    </div>
                    <div className="content-text">
                        <span className="section-label" style={{ color: accentColor }}>EXPERIENCE</span>
                        <h2>A resonance that transcends the ordinary.</h2>
                        <p>
                            We build not just for the eyes, but for the spirit. The <strong style={{ color: accentColor }}>{pageData.name}</strong> collection
                            is an invitation to experience life with heightened awareness, where every touchpoint
                            serves as a reminder of your own karma.
                        </p>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <ProductsSection
                categoryId={pageData._id}
                title={`${pageData.name.toUpperCase()} COLLECTION`}
                subtitle="Available Archives"
            />

            <footer style={{ padding: '6rem 2rem', textAlign: 'center', background: '#000' }}>
                <p style={{ opacity: 0.3, letterSpacing: '0.2em', fontSize: '0.7rem' }}>
                    OWN KARMA &copy; 2025 &middot; CHAPTER: {pageData.name.toUpperCase()}
                </p>
            </footer>
        </div>
    )
}

export default CollectionPage
