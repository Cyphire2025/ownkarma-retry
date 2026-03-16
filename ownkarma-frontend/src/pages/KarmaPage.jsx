import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageSequence } from '../utils/ImageSequence'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProductsSection from '../components/ProductsSection'
import '../styles/karma.css'

gsap.registerPlugin(ScrollTrigger)

const frameCounts = {
    karma: 200 // 399/2
}

function KarmaPage() {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const karmaSeqRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        gsap.ticker.lagSmoothing(0)

        // Initialize canvas size first
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth
            canvasRef.current.height = window.innerHeight

            // Initialize image sequence using Cache
            karmaSeqRef.current = ImageSequence.getSequence(
                'karmaeye-399',
                canvasRef.current,
                'karmaeye', // Folder name
                frameCounts.karma * 2, // Original count
                'frame_',
                2, // Stride
                null,
                '.avif'
            )
        }

        // Auto-play after images start loading
        setTimeout(() => {
            playOnce()
        }, 100)

        return () => {
            gsap.killTweensOf(karmaSeqRef.current?.frame)
            ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
    }, [])

    const playOnce = () => {
        if (!karmaSeqRef.current) return

        // Animate from frame 0 to last frame - INFINITE LOOP
        gsap.to(karmaSeqRef.current.frame, {
            index: frameCounts.karma - 1,
            duration: 13, // Longer video, longer duration (approx 47s @ 30fps)
            ease: 'none',
            repeat: -1, // Loop infinitely
            yoyo: false,
            onUpdate: () => {
                karmaSeqRef.current.render()
            },
            onRepeat: () => {
                // Reset to frame 0 on each loop
                karmaSeqRef.current.frame.index = 0
            }
        })
    }

    const handleBack = () => {
        navigate('/')
    }

    return (
        <div className="karma-page-scroll" ref={containerRef}>
            {/* Back Button */}
            <button className="back-button" onClick={handleBack}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {/* Video Section */}
            <section className="video-section">
                <canvas ref={canvasRef} className="karma-canvas" />

                {/* Header */}
                <header className="karma-header">
                    <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>KARMA'S EYE</h1>
                    <p>Witness To Every Action</p>
                </header>

                {/* Cloud Transition Effect (optional, reused logic or styled via CSS) */}
                <div className="cloud-transition"></div>
            </section>

            {/* Content Sections */}
            <section className="content-section ideation-section">
                <div className="content-container">
                    <div className="content-text">
                        <span className="section-label">VISION</span>
                        <h2>The universe watches with a thousand eyes, seeing truth beyond the veil.</h2>
                        <p>
                            <strong>Karma's Eye</strong> reflects the eternal law of cause and effect.
                            It is the silent observer, the keeper of balance, reminding us that
                            every action ripples through the fabric of existence.
                        </p>
                    </div>
                    <div className="content-image">
                        <div className="image-placeholder">
                            {/* Placeholder or specific image */}
                            <img src="/backgrounds/2.png" alt="Karma's Eye Concept" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="content-section engineering-section">
                <div className="content-container reverse">
                    <div className="content-image">
                        <div className="image-placeholder">
                            {/* Placeholder or specific image */}
                            <img src="/backgrounds/3.png" alt="Karma's Eye Detail" />
                        </div>
                    </div>
                    <div className="content-text">
                        <span className="section-label">REFLECTION</span>
                        <h2>A mirror to the soul, unclouded by judgment.</h2>
                        <p>
                            Designed to embody clarity and consequence.
                            <strong>Karma's Eye</strong> is not just a piece of art; it is a
                            symbol of awareness, urging you to live with intention and purpose.
                        </p>
                    </div>
                </div>
            </section>

            {/* Products Section - Automatically fetches products listed on 'karma-eye' page */}
            <ProductsSection
                pageName="karma-eye"
                title="Karma's Eye Collection"
                subtitle="Witness the reflection of your choices"
            />
        </div>
    )
}

export default KarmaPage
