import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageSequence } from '../utils/ImageSequence'
import CartIcon from '../components/CartIcon'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'
import gsap from 'gsap'
import '../styles/divine.css'

export const STAGES = [
    {
        id: 0,
        folder: '/varanasi images/varn1',
        frames: 601,
        loop: false,
        audio: '/audio/stage0.mp3',
        format: '.webp',
        durationSec: 20,
        text1: "LIVING CONSCIOUSLY",
        text2: "BUILDING OWN KARMA"
    },
    {
        id: 1,
        folder: '/varanasi images/varn2',
        frames: 617,
        loop: false,
        audio: '/audio/stage1.mp3',
        format: '.webp',
        durationSec: 20,
        text1: "We do not stand above creation",
        text2: "We live inside it"
    },
    {
        id: 2,
        folder: '/varanasi images/varn3',
        frames: 625,
        loop: false,
        audio: '/audio/stage2.mp3',
        format: '.webp',
        durationSec: 20,
        text1: "Awareness is not given",
        text2: "It is built"
    },
    {
        id: 3,
        folder: '/varanasi images/varn4',
        frames: 615,
        loop: false,
        audio: '/audio/stage3.mp3',
        format: '.webp',
        durationSec: 20,
        text1: "Walls are built by fear",
        text2: "Freedom begins with action"
    },
    {
        id: 4,
        folder: '/varanasi images/varn5',
        frames: 601,
        loop: false,
        audio: '/audio/stage4.mp3',
        format: '.webp',
        durationSec: 20,
        text1: "Life is not linear",
        text2: "It is lived in phases"
    }
]

// Hardcoded chapter cards for sidebar (always visible)
const CHAPTER_CARDS = [
    {
        _id: 'divine',
        name: 'DIVINE',
        image: '/backgrounds/1.png',
        color: '#646464ff',
        glow: '255, 215, 0', // Gold
        link: '/divine'
    },
    {
        _id: 'karma-eye',
        name: "KARMA'S EYE",
        image: '/backgrounds/2.png',
        color: '#646464ff',
        glow: '245, 222, 179', // Cream
        link: '/karma-eye'
    },
    {
        _id: 'destiny',
        name: 'DESTINY',
        image: '/backgrounds/3.png',
        color: '#646464ff',
        glow: '255, 255, 255', // White
        link: '/destiny'
    },
    {
        _id: 'broken-hourglass',
        name: 'BROKEN HOURGLASS',
        image: '/backgrounds/4.png',
        color: '#646464ff',
        glow: '139, 69, 19', // Brown
        link: '/broken-hourglass'
    }
]

function IntroPage() {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const headerRef = useRef(null)
    const seqRef = useRef(null)
    const progressRef = useRef(null)

    const [stage, setStage] = useState(0)
    const { user } = useAuth()
    const [authModalOpen, setAuthModalOpen] = useState(false)

    // UI State
    const [showButton, setShowButton] = useState(false)
    // const [showScrollPrompt, setShowScrollPrompt] = useState(false) // Removed
    const [menuOpen, setMenuOpen] = useState(false) // Hamburger Menu State

    // Audio State
    const [isMuted, setIsMuted] = useState(true) // Start muted by default
    const audioRef = useRef(null)

    // Sidebar now uses hardcoded CHAPTER_CARDS instead of fetching from backend

    const getPageLink = (name) => {
        const n = name.toLowerCase().trim()
        if (n.includes('divine')) return '/divine'
        if (n.includes('karma')) return '/karma-eye'
        if (n.includes('destiny')) return '/destiny'
        if (n.includes('hourglass')) return '/broken-hourglass'
        return `/collection/${n.replace(/\s+/g, '-')}`
    }

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
        } else {
            return '255, 255, 255';
        }

        return `${r}, ${g}, ${b}`;
    }

    useEffect(() => {
        // Initialize Audio and attach to DOM
        const audio = document.createElement('audio')
        // audio.src = STAGES[0].audio
        audio.src = '/audio/background1.mp3' // Reverted to single audio
        audio.loop = true
        audio.volume = 0.5
        audio.preload = 'auto'
        audio.style.display = 'none'
        audio.muted = true // Force mute initially
        document.body.appendChild(audio)
        audioRef.current = audio

        // Play Muted immediately (usually allowed)
        audio.play().catch(e => console.log("Audio play failed", e))

        return () => {
            if (document.body.contains(audio)) {
                document.body.removeChild(audio)
            }
            audio.pause()
            audio.src = ''
        }
    }, [])

    const toggleAudio = () => {
        if (!audioRef.current) return

        const newMutedState = !isMuted
        setIsMuted(newMutedState)
        audioRef.current.muted = newMutedState

        // Ensure it's playing if we unmute (in case it paused)
        if (!newMutedState) {
            audioRef.current.play().catch(e => console.error("Play failed", e))
        }
    }

    // Header Visibility (No state for transitions to avoid re-renders, purely DOM)
    // const [showHeader, setShowHeader] = useState(true) // Removed to fix smoother transitions as requested. directionRef = useRef('next')

    const directionRef = useRef('next')

    const state = useRef({
        frame: 0,
        velocity: 0.5,
        baseSpeed: 0.5,
        targetSpeed: 0.5,
        buttonTriggered: false
    })

    // Track previous frame to avoid redundant DOM updates
    const prevFrameRef = useRef(-1)

    // Initialize/Swap Sequence when Stage changes
    useEffect(() => {
        if (!canvasRef.current) return

        const currentStageData = STAGES[stage]
        state.current.buttonTriggered = false

        // --- Init Frame based on Direction ---
        if (directionRef.current === 'prev') {
            state.current.frame = currentStageData.frames - 1
            // Show button when reversing into a stage
            setShowButton(true)
        } else {
            state.current.frame = 0
            setShowButton(false)
        }

        // --- Switch Audio Track ---
        /* Commented out per-stage audio switching
        if (audioRef.current) {
            audioRef.current.src = currentStageData.audio
            // Ensure playback resumes (even if muted)
            audioRef.current.play().catch(e => console.log("Audio switch play failed", e))
        }
        */

        // --- Speed Settings ---
        // Play each section in ~16 seconds using all frames
        const desiredDurationSec = currentStageData.durationSec || 16
        const framesPerSecond = currentStageData.frames / desiredDurationSec
        state.current.velocity = framesPerSecond
        state.current.baseSpeed = framesPerSecond
        state.current.targetSpeed = framesPerSecond

        // UNIQUE KEY for Cache: folder + frames
        const seqKey = `${currentStageData.folder}-${currentStageData.frames}`

        // USE CACHED FACTORY
        // USE CACHED FACTORY
        seqRef.current = ImageSequence.getSequence(
            seqKey,
            canvasRef.current,
            currentStageData.folder,
            currentStageData.frames,
            'frame_',
            1,
            null,
            currentStageData.format || '.webp',
            currentStageData.crop || null
        )

        // Force initial render of the new sequence
        seqRef.current.frame.index = Math.floor(state.current.frame)
        seqRef.current.render(true)

    }, [stage])

    // Main Animation Loop
    useEffect(() => {
        gsap.ticker.lagSmoothing(0)

        const tick = (time, deltaTime) => {
            if (!seqRef.current) return

            const s = state.current
            const config = STAGES[stage]

            s.velocity += (s.baseSpeed - s.velocity) * 0.05
            const dt = (deltaTime || 16.67) / 1000
            s.frame += s.velocity * dt

            // --- Logic ---
            if (config.loop) {
                if (s.frame >= config.frames) s.frame = 0
                if (s.frame < 0) s.frame = config.frames - 1
            } else {
                if (s.frame >= config.frames - 1) {
                    s.frame = config.frames - 1
                    s.velocity = 0

                    // Button trigger moved to generic logic below
                }
                if (s.frame <= 0) {
                    s.frame = 0
                    if (s.velocity < 0) s.velocity = 0 // Prevent negative drift
                }

                // Trigger Button 400 frames before end
                const triggerFrame = Math.max(0, config.frames - 400)
                if (s.frame >= triggerFrame && !s.buttonTriggered) {
                    s.buttonTriggered = true
                    setShowButton(true)
                }
            }

            const currentIdx = Math.floor(s.frame)

            // OPTIMIZATION: Check if frame index actually changed before updating DOM
            if (currentIdx !== prevFrameRef.current) {
                prevFrameRef.current = currentIdx

                // --- Render Frame ---
                seqRef.current.frame.index = currentIdx
                seqRef.current.render() // .render() has internal optimization now

                // --- DOM Updates only on frame change ---
                if (progressRef.current) {
                    const progress = Math.max(0, Math.min(1, s.frame / (config.frames - 1)))
                    progressRef.current.style.height = `${progress * 100}%`
                }


                // Sync Text for ALL stages
                syncText(s.frame, config.frames)
            }
        }

        gsap.ticker.add(tick)

        const handleWheel = (e) => {
            // ----------------------------------------
            // --- SCROLL SPEED CONFIGURATION SECTION ---
            // ----------------------------------------
            // Keep scroll traversal roughly 5s for every stage.
            const TARGET_SCROLL_TRAVERSE_SEC = 5
            const WHEEL_DELTA_NORMALIZER = 100
            const MAX_SCROLL_MULTIPLIER = 2
            // ----------------------------------

            // --- Transitions ---

            // Transition Prev/Next logic
            // We can simplify this. If at bounds, transition.

            const currentFrames = STAGES[stage].frames

            // NEXT Transition
            if (stage < STAGES.length - 1) {
                // If at end of video and scrolling down
                // If at end of video and scrolling down
                if (state.current.frame > currentFrames - 50 && e.deltaY > 50) {
                    // Stage 0: Lock scroll. User MUST click "Enter Experience".
                    if (stage === 0) return

                    transitionToStage(stage + 1, 'next')
                    return
                }
            }

            // PREV Transition
            if (stage > 0) {
                // If at start of video and scrolling up
                if (state.current.frame < 50 && e.deltaY < -50) {
                    transitionToStage(stage - 1, 'prev')
                    return
                }
            }

            const targetScrollVelocity = currentFrames / TARGET_SCROLL_TRAVERSE_SEC
            const sensitivity = targetScrollVelocity / WHEEL_DELTA_NORMALIZER
            state.current.velocity += e.deltaY * sensitivity

            const maxSpeed = targetScrollVelocity * MAX_SCROLL_MULTIPLIER
            if (state.current.velocity > maxSpeed) state.current.velocity = maxSpeed
            if (state.current.velocity < -maxSpeed) state.current.velocity = -maxSpeed
        }

        window.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            gsap.ticker.remove(tick)
            window.removeEventListener('wheel', handleWheel)
        }
    }, [stage])

    const transitionToStage = (nextStage, direction = 'next') => {
        const canvas = canvasRef.current
        const tl = gsap.timeline()
        directionRef.current = direction

        // Hide UI during transition
        setShowButton(false)

        // UNMOUNT HEADER INSTANTLY
        // setShowHeader(false) // Removed to prevent crash
        if (headerRef.current) gsap.set(headerRef.current, { opacity: 0, overwrite: true })

        const outY = direction === 'next' ? '-100vh' : '100vh'
        const inY = direction === 'next' ? '100vh' : '-100vh'

        tl.to(canvas, {
            y: outY,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                setStage(nextStage)
            }
        })
            .set(canvas, { y: inY })
            .to(canvas, {
                y: '0%',
                duration: 0.8,
                ease: 'power2.out'
            })
    }

    const handleDotClick = (targetIndex) => {
        if (targetIndex === stage) return
        const direction = targetIndex > stage ? 'next' : 'prev'
        transitionToStage(targetIndex, direction)
    }

    const syncText = (frame, totalFrames) => {
        const t1 = document.getElementById('stage-text-1')
        const t2 = document.getElementById('stage-text-2')

        // Calculate percentages to handle different video lengths generically
        // Text 1: Appears ~20% -> Fades out ~45%
        // Text 2: Appears ~55% -> Fades out ~80%

        const start1 = totalFrames * 0.2
        const end1 = totalFrames * 0.45

        const start2 = totalFrames * 0.55
        const end2 = totalFrames * 0.8

        if (t1) {
            if (frame > start1 && frame < end1) t1.style.opacity = 1
            else t1.style.opacity = 0
        }

        if (t2) {
            if (frame > start2 && frame < end2) t2.style.opacity = 1
            else t2.style.opacity = 0
        }
    }

    const handleEnterExperience = () => {
        transitionToStage(1)
    }

    const handleExploreProducts = () => {
        const overlay = document.createElement('div')
        overlay.className = 'transition-overlay'
        overlay.style.cssText = `
             position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
             background: #000; z-index: 9999; opacity: 0; transition: opacity 0.6s ease; pointer-events: none;
         `
        document.body.appendChild(overlay)
        requestAnimationFrame(() => overlay.style.opacity = '1')
        setTimeout(() => {
            navigate('/products')
            // Cleanup: fade out and remove
            setTimeout(() => {
                overlay.style.opacity = '0'
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
                }, 600)
            }, 100)
        }, 600)
    }

    // Styles
    const wrapperStyle = {
        position: 'absolute',
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        textAlign: 'center',
        opacity: 0,
        transition: 'opacity 1s ease',
        pointerEvents: 'none'
    }

    const buttonStyle = {
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: 'white',
        padding: '1rem 2rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        cursor: 'pointer',
        backdropFilter: 'blur(5px)',
        transition: 'all 0.3s ease',
        fontSize: '0.8rem',
        borderRadius: '9999px'
    }

    return (
        <div style={{ width: '100%', height: '100dvh', minHeight: '100vh', background: 'black', overflow: 'hidden', position: 'relative' }}>
            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Overlays */}
            <>
                {/* Dynamic Text for Current Stage */}
                <div id="stage-text-1"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        transition: 'opacity 1s ease',
                        opacity: 0,
                        width: '100%',
                        padding: '0 20px',
                        color: 'white',
                        zIndex: 40
                    }}
                >
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 3.5rem)',
                        fontWeight: '300',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        textShadow: '0 0 30px rgba(0,0,0,0.8)'
                    }}>
                        {STAGES[stage].text1}
                    </h2>
                </div>

                <div id="stage-text-2"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        transition: 'opacity 1s ease',
                        opacity: 0,
                        width: '100%',
                        padding: '0 20px',
                        color: 'white',
                        zIndex: 40
                    }}
                >
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 3.5rem)',
                        fontWeight: '300',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        textShadow: '0 0 30px rgba(0,0,0,0.8)'
                    }}>
                        {STAGES[stage].text2}
                    </h2>
                </div>

                {/* Unified Button Logic for All Stages */}
                <div style={{ ...wrapperStyle, opacity: showButton ? 1 : 0, pointerEvents: showButton ? 'auto' : 'none' }}>
                    <button
                        onClick={() => {
                            if (stage === 4) {
                                handleExploreProducts()
                            } else {
                                transitionToStage(stage + 1)
                            }
                        }}
                        style={buttonStyle}
                        onMouseEnter={(e) => { e.target.style.background = 'white'; e.target.style.color = 'black' }}
                        onMouseLeave={(e) => { e.target.style.background = 'rgba(0, 0, 0, 0.3)'; e.target.style.color = 'white' }}
                    >
                        {stage === 0 && "Explore Chapter 1"}
                        {stage === 1 && "Explore Chapter 2"}
                        {stage === 2 && "Explore Chapter 3"}
                        {stage === 3 && "Explore Chapter 4"}
                        {stage === 4 && "Explore All Chapters"}
                    </button>
                </div>
            </>

            {/* Progress Dots - Interactive */}
            <div style={{
                position: 'absolute',
                right: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                zIndex: 9999
            }}>
                {STAGES.map((s, idx) => {
                    const isActive = stage === idx;
                    return (
                        <div
                            key={idx}
                            onClick={() => handleDotClick(idx)}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'all 0.5s ease',
                                cursor: 'pointer', // Make it look clickable
                                padding: '4px' // Hit area
                            }}
                        >
                            {isActive ? (
                                <div style={{
                                    width: '6px',
                                    height: '48px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '999px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    pointerEvents: 'none'
                                }}>
                                    <div
                                        ref={progressRef}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#fff',
                                            borderRadius: '999px',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '0%'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: '50%',
                                    transition: 'background-color 0.3s'
                                }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'white'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'}
                                />
                            )}
                        </div>
                    )
                })}
            </div>



            {/* --- AUDIO TOGGLE --- */}
            <div
                onClick={toggleAudio}
                style={{
                    position: 'absolute',
                    top: '2.3rem',
                    right: '9rem', // Moved further left
                    zIndex: 99999,
                    cursor: 'pointer',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    opacity: 0.8,
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
            >
                {isMuted ? (
                    // Muted Icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                ) : (
                    // Speaker Icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                )}
            </div>

            {/* --- CART ICON --- */}
            <div style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                zIndex: 99999
            }}>
                <CartIcon position="relative" />
            </div>

            {/* --- PROFILE ICON --- */}
            <div style={{
                position: 'absolute',
                top: '2rem',
                right: '6rem', // Adjusted spacing between Cart (2rem) and Mute (10rem)
                zIndex: 99999
            }}>
                <button
                    onClick={() => {
                        if (user) {
                            navigate('/profile')
                        } else {
                            setAuthModalOpen(true)
                        }
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </button>
            </div>

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
            />

            {/* --- HAMBURGER MENU BUTTON --- */}
            <div
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                    position: 'absolute',
                    top: '2.5rem',
                    left: '2.5rem',
                    zIndex: 99999,
                    cursor: 'pointer',
                    width: '32px',
                    height: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ width: '100%', height: '1.5px', background: 'white', transition: 'all 0.3s' }} />
                <div style={{ width: '100%', height: '1.5px', background: 'white', transition: 'all 0.3s' }} />
            </div>

            {/* --- SIDEBAR MENU DRAWER --- */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99997,
                    opacity: menuOpen ? 1 : 0,
                    pointerEvents: menuOpen ? 'auto' : 'none',
                    transition: 'opacity 0.6s ease'
                }}
                onClick={() => setMenuOpen(false)}
            />

            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: 'min(100vw, 450px)',
                height: '100dvh',
                minHeight: '100vh',
                background: '#141414',
                zIndex: 99998,
                transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                overflow: 'hidden',
                overscrollBehavior: 'contain'
            }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    padding: 'clamp(1rem, 2vw, 2rem)',
                    paddingTop: 'clamp(4rem, 10vh, 6rem)',
                    paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                    display: 'grid',
                    gridTemplateRows: 'auto minmax(0, 1fr)',
                    rowGap: '1.2rem',
                    boxSizing: 'border-box'
                }}>
                    <h2 style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.8rem',
                        letterSpacing: '0.15em',
                        marginBottom: 0,
                        fontFamily: 'sans-serif',
                        marginLeft: '5px',
                        flexShrink: 0
                    }}>
                        OUR CHAPTERS
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
                        gap: '1.2rem',
                        alignContent: 'stretch',
                        minHeight: 0
                    }}>
                        {CHAPTER_CARDS.map((item, idx) => (
                            <div
                                key={item._id || idx}
                                className="menu-card"
                                style={{
                                    '--glow-color': item.glow,
                                    '--theme-color': item.color || 'rgba(255,255,255,0.1)'
                                }}
                                onClick={() => {
                                    setMenuOpen(false)
                                    navigate(item.link)
                                }}
                            >
                                <div className="menu-card-inner">
                                    <div
                                        className="menu-card-bg"
                                        style={{
                                            backgroundImage: `url(${item.image})`,
                                            opacity: 0.6
                                        }}
                                    />

                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        paddingRight: 'clamp(1.1rem, 4vw, 3rem)'
                                    }}>
                                        <h3 style={{
                                            color: 'white',
                                            fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
                                            letterSpacing: '0.05em',
                                            fontWeight: '500',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            {item.name}
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .intro-text-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    text-align: center;
                    transition: opacity 0.5s ease;
                    pointer-events: none;
                    width: 100%;
                }
                .intro-text-overlay h2 {
                    font-size: clamp(1.5rem, 4vw, 3rem);
                    font-weight: 300;
                    letter-spacing: 0.5em;
                     text-shadow: 0 0 20px rgba(255,255,255,0.3);
                }
                .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
                .animate-bounce { animation: bounce 2s infinite; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounce { 
                    0%, 100% { transform: translateY(0); } 
                    50% { transform: translateY(10px); } 
                }

                /* Premium Menu Card Styles */
                .menu-card {
                    height: 100%;
                    max-height: 140px;
                    width: 100%;
                    border-radius: 12px;
                    overflow: visible; /* Needed for outside shadow/glow */
                    position: relative;
                    cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.08);
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    background: #0a0a0a;
                    /* No elevation or glow in normal state */
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }

                .menu-card-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    z-index: 2;
                }
                
                .menu-card::before {
                    content: '';
                    position: absolute;
                    inset: -3px; /* Reduced spread prevents visual clipping on short viewports */
                    z-index: 1;
                    border-radius: 16px;
                    background: radial-gradient(circle at center, rgba(var(--glow-color),0.4), transparent 70%);
                    opacity: 0; /* Hidden in normal state */
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    filter: blur(12px);
                }

                .menu-card:hover {
                    transform: translateY(-6px) scale(1.01); /* Softer hover to avoid viewport overflow */
                    border-color: var(--theme-color);
                    /* Dynamic Colored Glow + Deep Shadow */
                    box-shadow: 
                        0 30px 60px -15px rgba(0,0,0,0.8),
                        0 0 30px -5px rgba(var(--glow-color), 0.4); 
                }

                .menu-card:hover::before {
                    opacity: 1;
                    transform: translateY(4px); /* Parallax effect for the glow */
                }

                .menu-card-bg {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    filter: brightness(0.6) grayscale(20%);
                    transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);
                    transform: scale(1);
                }

                .menu-card:hover .menu-card-bg {
                    filter: brightness(0.9) grayscale(0%);
                    transform: scale(1.08); /* Slow cinematic zoom */
                }
            `}</style>
        </div>
    )
}

export default IntroPage
