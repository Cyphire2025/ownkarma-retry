import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageSequence } from '../utils/ImageSequence'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProductsSection from '../components/ProductsSection'
import '../styles/divine.css'

gsap.registerPlugin(ScrollTrigger)

const frameCounts = {
    destiny: 151 // 302/2
}

function DestinyPage() {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const seqRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        gsap.ticker.lagSmoothing(0)

        // Initialize canvas
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth
            canvasRef.current.height = window.innerHeight

            // Initialize sequence
            seqRef.current = ImageSequence.getSequence(
                'destiny-302',
                canvasRef.current,
                'destiny', // Folder
                frameCounts.destiny * 2,
                'frame_',
                2,
                null,
                '.avif'
            )
        }

        // Auto-play after images start loading
        setTimeout(() => {
            playOnce()
        }, 100)

        return () => {
            gsap.killTweensOf(seqRef.current?.frame)
            ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
    }, [])

    const playOnce = () => {
        if (!seqRef.current) return

        // Animate from frame 0 to last frame - INFINITE LOOP
        gsap.to(seqRef.current.frame, {
            index: frameCounts.destiny - 1,
            duration: 10, // Proportional to Karma's 13s for 399 frames
            ease: 'none',
            repeat: -1, // Loop infinitely
            yoyo: false,
            onUpdate: () => {
                seqRef.current.render()
            },
            onRepeat: () => {
                // Reset to frame 0 on each loop
                seqRef.current.frame.index = 0
            }
        })
    }

    const handleBack = () => {
        navigate('/')
    }

    return (
        <div className="divine-page-scroll" ref={containerRef}>
            {/* Back Button */}
            <button className="back-button" onClick={handleBack}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {/* Video Section */}
            <section className="video-section">
                <canvas ref={canvasRef} className="divine-canvas" style={{ zIndex: 1 }} />

                {/* Header Overlay */}
                <header className="divine-header">
                    <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>DESTINY</h1>
                    <p>Written In The Stars</p>
                </header>

                {/* Cloud Transition Effect */}
                <div className="cloud-transition"></div>
            </section>

            {/* Content Sections */}
            <section className="content-section ideation-section">
                <div className="content-container">
                    <div className="content-text">
                        <span className="section-label">VISION</span>
                        <h2>The path is not found, it is forged by the choices we make.</h2>
                        <p>
                            <strong>Destiny</strong> is not a predetermined conclusion, but a canvas
                            waiting for your brushstroke. It embodies the courage to embrace the unknown
                            and the wisdom to trust the journey.
                        </p>
                    </div>
                    <div className="content-image">
                        <div className="image-placeholder">
                            {/* Placeholder or specific image */}
                            <img src="/backgrounds/3.png" alt="Destiny Concept" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="content-section engineering-section">
                <div className="content-container reverse">
                    <div className="content-image">
                        <div className="image-placeholder">
                            {/* Placeholder or specific image */}
                            <img src="/backgrounds/4.png" alt="Destiny Detail" />
                        </div>
                    </div>
                    <div className="content-text">
                        <span className="section-label">REFLECTION</span>
                        <h2>A constellation of moments, aligning to form your truth.</h2>
                        <p>
                            Every thread woven with intention. <strong>Destiny</strong> reminds us that
                            while we may not control the stars, we can steer the ship. It is an
                            ode to those who dare to write their own story.
                        </p>
                    </div>
                </div>
            </section>

            {/* Products Section - Automatically fetches products listed on 'destiny' page */}
            <ProductsSection
                pageName="destiny"
                title="Destiny Collection"
                subtitle="Your future is waiting"
            />

        </div>
    )
}

export default DestinyPage
