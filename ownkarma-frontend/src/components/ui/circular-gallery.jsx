import React, { forwardRef, useEffect, useRef, useState } from 'react'
import '../../styles/circular-gallery.css'

const cn = (...classes) => classes.filter(Boolean).join(' ')
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const CircularGallery = forwardRef(function CircularGallery(
    {
        items,
        className,
        radius = 600,
        autoRotateSpeed = 0.02,
        wheelRotateSpeed = 0.01,
        onItemClick,
        centerContent,
        centerClassName,
        onRotationTick,
        style,
        ...props
    },
    ref
) {
    const [rotation, setRotation] = useState(0)
    const animationFrameRef = useRef(null)
    const currentRotationRef = useRef(0)
    const targetRotationRef = useRef(0)

    useEffect(() => {
        const tick = () => {
            // Constant auto rotation baseline
            targetRotationRef.current += autoRotateSpeed

            // Smoothly chase target for ultra-fluid wheel motion
            currentRotationRef.current +=
                (targetRotationRef.current - currentRotationRef.current) * 0.3

            setRotation(currentRotationRef.current)
            onRotationTick?.(currentRotationRef.current)
            animationFrameRef.current = requestAnimationFrame(tick)
        }

        animationFrameRef.current = requestAnimationFrame(tick)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [autoRotateSpeed])

    if (!items?.length) {
        return null
    }

    const anglePerItem = 360 / items.length
    const resolvedCenterContent =
        typeof centerContent === 'function' ? centerContent(rotation) : centerContent

    const handleWheel = (event) => {
        event.preventDefault()

        const delta = clamp(event.deltaY + event.deltaX, -240, 240)
        targetRotationRef.current += delta * wheelRotateSpeed
    }

    const handleCardPointerMove = (event) => {
        const button = event.currentTarget
        const card = button.querySelector('.cg-card')
        if (!card) return

        const rect = button.getBoundingClientRect()
        const px = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
        const py = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
        const tiltY = ((px - 50) / 50) * 8
        const tiltX = ((50 - py) / 50) * 8

        card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`)
        card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`)
        card.style.setProperty('--pointer-x', `${px.toFixed(2)}%`)
        card.style.setProperty('--pointer-y', `${py.toFixed(2)}%`)
        card.style.setProperty('--glow-opacity', '1')
    }

    const handleCardPointerLeave = (event) => {
        const button = event.currentTarget
        const card = button.querySelector('.cg-card')
        if (!card) return

        card.style.setProperty('--tilt-x', '0deg')
        card.style.setProperty('--tilt-y', '0deg')
        card.style.setProperty('--pointer-x', '50%')
        card.style.setProperty('--pointer-y', '50%')
        card.style.setProperty('--glow-opacity', '0')
    }

    return (
        <div
            ref={ref}
            role="region"
            aria-label="Circular 3D Gallery"
            className={cn('cg-root', className)}
            style={{ ...style, perspective: '2000px', position: 'relative', width: '100%', height: '100%' }}
            onWheel={handleWheel}
            {...props}
        >
            <div
                className="cg-wheel"
                style={{
                    transform: `rotateY(${rotation}deg)`,
                    transformStyle: 'preserve-3d',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                }}
            >
                {resolvedCenterContent ? (
                    <div className={cn('cg-center', centerClassName)}>
                        {resolvedCenterContent}
                    </div>
                ) : null}
                {items.map((item, index) => {
                    const itemAngle = index * anglePerItem
                    const totalRotation = rotation % 360
                    const relativeAngle = (itemAngle + totalRotation + 360) % 360
                    const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle)
                    const opacity = Math.max(0.3, 1 - normalizedAngle / 180)
                    const depth = 1 - normalizedAngle / 180

                    return (
                        <button
                            key={`${item.common}-${index}`}
                            type="button"
                            role="group"
                            aria-label={item.common}
                            className="cg-item"
                            style={{
                                position: 'absolute',
                                width: '300px',
                                height: '400px',
                                left: '50%',
                                top: '50%',
                                marginLeft: '-150px',
                                marginTop: '-200px',
                                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                                opacity,
                                zIndex: Math.round(depth * 100),
                                '--item-glow': item.glow || '255, 255, 255',
                            }}
                            onPointerMove={handleCardPointerMove}
                            onPointerLeave={handleCardPointerLeave}
                            onClick={() => onItemClick?.(item, index)}
                        >
                            <div className="cg-card">
                                <img
                                    src={item.photo.url}
                                    alt={item.photo.text}
                                    className="cg-image"
                                    style={{ objectPosition: item.photo.pos || 'center' }}
                                />
                                <div className="cg-overlay">
                                    <h2 className="cg-title">{item.common}</h2>
                                    <em className="cg-subtitle">{item.binomial}</em>
                                    <p className="cg-credit">Photo by: {item.photo.by}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
})

export { CircularGallery }
