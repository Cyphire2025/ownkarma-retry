import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { productsAPI } from '../lib/medusa-api'
import { useCart } from '../context/CartContext'
import { trackViewItem } from '../lib/analytics'
import SiteFooter from '../components/SiteFooter'
import { SmokeBackground } from '../components/ui/spooky-smoke-animation'
import '../styles/product-detail.css'

const normalizeOptionTitle = (value = '') => value.trim().toLowerCase()
const normalizeToken = (value = '') => value.trim().toLowerCase()

const COLOR_SWATCHES = {
    black: '#111111',
    white: '#f5f5f1',
    grey: '#8a8a8a',
    gray: '#8a8a8a',
    red: '#9f2f2f',
    blue: '#365d9c',
    green: '#476b4e',
    brown: '#7b593b',
    beige: '#cfb48d',
    cream: '#ece2cf',
    navy: '#24324a',
    olive: '#55613c',
}

const getOptionValue = (variant, optionId) => {
    if (!variant || !optionId) return ''
    return variant.options?.find((opt) => opt.option_id === optionId || opt.option?.id === optionId)?.value || ''
}

const getColorSwatchStyle = (colorValue) => {
    const normalized = normalizeToken(colorValue)
    const color = COLOR_SWATCHES[normalized]

    if (color) {
        return { background: color }
    }

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorValue || '')) {
        return { background: colorValue }
    }

    return {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(184,138,79,0.55))'
    }
}

const getImageMatchTokens = (value = '') => {
    const normalized = normalizeToken(value)
    if (!normalized) return []

    const compact = normalized.replace(/\s+/g, '')
    const hyphenated = normalized.replace(/\s+/g, '-')
    const underscored = normalized.replace(/\s+/g, '_')

    return Array.from(new Set([normalized, compact, hyphenated, underscored])).filter(Boolean)
}

const getVariantMediaUrls = (variant) => {
    const urls = []

    const pushUrl = (url) => {
        if (url && !urls.includes(url)) {
            urls.push(url)
        }
    }

    pushUrl(variant?.thumbnail)

    for (const image of variant?.images || []) {
        pushUrl(image?.url)
    }

    return urls
}

function TrustIcon({ index }) {
    if (index === 0) {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3L20 7V12C20 17.2 16.8 21.94 12 23C7.2 21.94 4 17.2 4 12V7L12 3Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }

    if (index === 1) {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="6" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M17 10H20L22 12.5V17H17V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="8" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        )
    }

    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

function ProductDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { addToCart } = useCart()

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedColor, setSelectedColor] = useState('')
    const [selectedSize, setSelectedSize] = useState('')
    const [selectedImage, setSelectedImage] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [showNotification, setShowNotification] = useState(false)
    const [openSpecIndex, setOpenSpecIndex] = useState(0)
    const lastTrackedProductId = useRef('')

    const getInrPriceAmount = (variant) => {
        const prices = variant?.prices || []
        const inrPrice = prices.find((p) => (p?.currency_code || '').toLowerCase() === 'inr')
        return inrPrice?.amount ?? null
    }

    const hasInrPrice = (variant) => getInrPriceAmount(variant) !== null

    useEffect(() => {
        fetchProduct()
    }, [id])

    useEffect(() => {
        if (!product?._id) return
        if (lastTrackedProductId.current === product._id) return

        const trackedVariant =
            product.variants?.find((variant) => hasInrPrice(variant)) ||
            product.variants?.[0]

        trackViewItem(
            {
                id: product._id,
                title: product.title,
            },
            trackedVariant,
            "INR"
        )

        lastTrackedProductId.current = product._id
    }, [product])

    const getDisplayPrice = (variants = []) => {
        if (!variants.length) return 0
        const pricedVariant = variants.find((variant) => hasInrPrice(variant))
        if (!pricedVariant) return 0
        return getInrPriceAmount(pricedVariant)
    }

    const fetchProduct = async () => {
        try {
            const response = await productsAPI.getById(id)

            if (!response.success || !response.product) {
                setProduct(null)
                setLoading(false)
                return
            }

            const medusaProduct = response.product

            const mappedProduct = {
                _id: medusaProduct.id,
                title: medusaProduct.title,
                tagline: medusaProduct.subtitle || medusaProduct.metadata?.tagline || '',
                description: medusaProduct.description || '',
                thumbnail: medusaProduct.thumbnail,
                images: medusaProduct.images?.map((img) => ({ url: img.url, metadata: img.metadata || null })) || [],
                price: getDisplayPrice(medusaProduct.variants || []),
                compareAtPrice: medusaProduct.metadata?.compareAtPrice || null,
                variants: medusaProduct.variants || [],
                options: medusaProduct.options || [],
                material: medusaProduct.metadata?.material || null,
                glowColor: medusaProduct.metadata?.glow || '255, 255, 255',
                themeColor: medusaProduct.metadata?.color || '#646464ff',
                metadata: medusaProduct.metadata || {}
            }

            setProduct(mappedProduct)
            setSelectedImage(0)
            setQuantity(1)
            setOpenSpecIndex(0)
            setSelectedColor('')
            setSelectedSize('')

            setLoading(false)
        } catch (error) {
            console.error('Error fetching product:', error)
            setProduct(null)
            setLoading(false)
        }
    }

    const purchasableVariants = useMemo(() => {
        return (product?.variants || []).filter((variant) => hasInrPrice(variant))
    }, [product])

    const sizeOption = useMemo(() => {
        return product?.options?.find((option) => normalizeOptionTitle(option.title).includes('size')) || null
    }, [product])

    const colorOption = useMemo(() => {
        const explicitColorOption =
            product?.options?.find((option) => {
                const normalized = normalizeOptionTitle(option.title)
                return normalized.includes('color') || normalized.includes('colour')
            }) || null

        if (explicitColorOption) return explicitColorOption

        return product?.options?.find((option) => option.id !== sizeOption?.id) || null
    }, [product, sizeOption])

    const variantSelections = useMemo(() => {
        return purchasableVariants.map((variant) => ({
            variant,
            color: getOptionValue(variant, colorOption?.id),
            size: getOptionValue(variant, sizeOption?.id),
        }))
    }, [purchasableVariants, colorOption, sizeOption])

    const colorValues = useMemo(() => {
        return Array.from(new Set(
            variantSelections
                .map(({ color }) => color)
                .filter(Boolean)
        ))
    }, [variantSelections])

    const sizeValues = useMemo(() => {
        return Array.from(new Set(
            variantSelections
                .filter(({ color }) => !selectedColor || !colorOption || color === selectedColor)
                .map(({ size }) => size)
                .filter(Boolean)
        ))
    }, [variantSelections, selectedColor, colorOption])

    const selectedVariant = useMemo(() => {
        if (!variantSelections.length) {
            return product?.variants?.find((variant) => !!variant.id) || product?.variants?.[0] || null
        }

        const exactMatch = variantSelections.find(({ color, size }) => {
            const colorMatches = !colorOption || !selectedColor || color === selectedColor
            const sizeMatches = !sizeOption || !selectedSize || size === selectedSize
            return colorMatches && sizeMatches
        })

        if (exactMatch) return exactMatch.variant

        if (selectedColor && colorOption) {
            const colorMatch = variantSelections.find(({ color }) => color === selectedColor)
            if (colorMatch) return colorMatch.variant
        }

        if (selectedSize && sizeOption) {
            const sizeMatch = variantSelections.find(({ size }) => size === selectedSize)
            if (sizeMatch) return sizeMatch.variant
        }

        return variantSelections[0].variant
    }, [variantSelections, product, colorOption, selectedColor, sizeOption, selectedSize])

    const selectedVariantPrice = useMemo(() => {
        if (!selectedVariant) return product?.price || 0
        const inrAmount = getInrPriceAmount(selectedVariant)
        return inrAmount != null ? inrAmount : product?.price || 0
    }, [selectedVariant, product])

    useEffect(() => {
        if (!product) return

        const initialVariant = purchasableVariants[0] || product.variants?.[0] || null
        if (!initialVariant) return

        setSelectedColor(getOptionValue(initialVariant, colorOption?.id))
        setSelectedSize(getOptionValue(initialVariant, sizeOption?.id))
    }, [product?._id, purchasableVariants, product?.variants, colorOption, sizeOption])

    useEffect(() => {
        if (!sizeOption || !sizeValues.length) {
            if (!sizeOption) {
                setSelectedSize('')
            }
            return
        }

        if (!sizeValues.includes(selectedSize)) {
            setSelectedSize(sizeValues[0])
        }
    }, [sizeOption, sizeValues, selectedSize])

    useEffect(() => {
        if (!colorOption) {
            setSelectedColor('')
            return
        }

        if (!colorValues.length) {
            setSelectedColor('')
            return
        }

        if (!colorValues.includes(selectedColor)) {
            setSelectedColor(colorValues[0])
        }
    }, [colorOption, colorValues, selectedColor])

    const handleAddToCart = async () => {
        if (!product) return

        if (!selectedVariant?.id) {
            alert('This product is currently unavailable (No Variant ID).')
            return
        }

        if (!hasInrPrice(selectedVariant)) {
            alert('This variant is not available for INR checkout yet.')
            return
        }

        const result = await addToCart(selectedVariant.id, quantity)
        if (!result?.success) {
            alert(result?.message || 'Failed to add item.')
            return
        }

        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
    }

    const increaseQuantity = () => setQuantity((q) => q + 1)
    const decreaseQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1))

    const galleryImages = useMemo(() => {
        if (!product) return []

        const selectedVariantMedia = getVariantMediaUrls(selectedVariant)
        if (selectedVariantMedia.length) {
            return selectedVariantMedia
        }

        const colorTokens = getImageMatchTokens(selectedColor)
        const variantThumbnail = selectedVariant?.thumbnail

        const matchedUrls = []
        const pushMatchedImage = (url) => {
            if (url && !matchedUrls.includes(url)) {
                matchedUrls.push(url)
            }
        }

        pushMatchedImage(variantThumbnail)

        if (colorTokens.length) {
            for (const image of product.images || []) {
                const imageUrl = image?.url || ''
                const imageMetadata = `${image?.metadata?.color || ''} ${image?.metadata?.variant || ''}`.toLowerCase()
                const lowerUrl = imageUrl.toLowerCase()

                if (colorTokens.some((token) => lowerUrl.includes(token) || imageMetadata.includes(token))) {
                    pushMatchedImage(imageUrl)
                }
            }
        }

        if (matchedUrls.length) {
            return matchedUrls
        }

        const urls = []
        const pushImage = (url) => {
            if (url && !urls.includes(url)) {
                urls.push(url)
            }
        }

        pushImage(product.thumbnail)

        for (const image of product.images || []) {
            pushImage(image?.url)
        }

        if (!urls.length) {
            urls.push('/backgrounds/1.png')
        }

        return urls
    }, [product, selectedColor, selectedVariant])

    useEffect(() => {
        setSelectedImage(0)
    }, [selectedVariant?.id])

    const activeImage = galleryImages[selectedImage] || galleryImages[0] || '/backgrounds/1.png'
    const secondaryImage = galleryImages[1] || galleryImages[0] || '/backgrounds/2.png'

    const accordionItems = useMemo(() => {
        if (!product) return []

        return [
            {
                title: 'Fit and Silhouette',
                content: product.metadata?.fit || 'Engineered with a relaxed luxury silhouette that drapes cleanly and layers effortlessly.'
            },
            {
                title: 'Fabric and Feel',
                content: product.material || product.metadata?.fabric || 'Premium heavyweight cotton blend with a brushed interior for structured comfort.'
            },
            {
                title: 'Care Instructions',
                content: product.metadata?.care || 'Machine wash cold inside out. Avoid tumble drying. Steam or low-heat iron when needed.'
            },
            {
                title: 'Delivery and Returns',
                content: 'Dispatch starts within 24 hours. Easy size exchange and return support is available in the standard policy window.'
            }
        ]
    }, [product])

    const trustItems = [
        {
            title: '24/7 Concierge Support',
            text: 'Real-time styling and order support from our team whenever you need it.'
        },
        {
            title: 'Fast Global Shipping',
            text: 'Priority dispatch with full shipment tracking from warehouse to your door.'
        },
        {
            title: 'Secure Checkout',
            text: 'Encrypted payment flow built on trusted commerce infrastructure.'
        }
    ]

    if (loading) {
        return (
            <div className="product-detail-loading">
                <div className="loading-spinner-large"></div>
                <p>Loading product...</p>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="product-not-found">
                <h2>Product Not Found</h2>
                <p>This product does not exist or has been removed.</p>
                <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
            </div>
        )
    }

    return (
        <div className="product-detail-page">
            {showNotification && (
                <div className="cart-notification">
                    <div className="notification-content">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="2" />
                            <path d="M8 12l2 2 4-4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                            <strong>Added to cart</strong>
                            <p>{quantity} x {product.title} {[selectedColor, selectedSize].filter(Boolean).length ? `(${[selectedColor, selectedSize].filter(Boolean).join(' / ')})` : ''}</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/cart', { state: { from: `${location.pathname}${location.search}` } })} className="view-cart-btn">View Cart</button>
                </div>
            )}

            <div className="product-detail-shell">
                <div className="pd-pre-video">
                    <div className="pd-smoke-bg is-pre" aria-hidden="true">
                        <SmokeBackground smokeColor="#b88a4f" />
                    </div>
                    <button className="back-button" onClick={() => navigate(-1)}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    BACK
                </button>

                <section className="pd-hero-grid">
                    <div className="pd-hero-image-block">
                        <div className="pd-main-image">
                            <img
                                src={activeImage}
                                alt={product.title}
                                onError={(e) => {
                                    e.target.src = '/backgrounds/1.png'
                                }}
                            />
                        </div>

                        {galleryImages.length > 1 && (
                            <div className="pd-thumbnail-strip">
                                {galleryImages.map((img, idx) => (
                                    <button
                                        key={`${img}-${idx}`}
                                        type="button"
                                        className={`pd-thumbnail ${selectedImage === idx ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(idx)}
                                        aria-label={`Select image ${idx + 1}`}
                                    >
                                        <img src={img} alt={`${product.title} view ${idx + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pd-hero-info">
                        <p className="pd-eyebrow">OWN KARMA / LUXURY APPAREL</p>
                        <h1 className="pd-title">{product.title}</h1>
                        {product.tagline && <p className="pd-tagline">{product.tagline}</p>}

                        <div className="pd-price-box">
                            <span className="pd-current-price">₹{selectedVariantPrice.toLocaleString('en-IN')}</span>
                            {product.compareAtPrice && (
                                <>
                                    <span className="pd-original-price">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
                                    {product.compareAtPrice > selectedVariantPrice && (
                                        <span className="pd-discount-badge">
                                            {Math.round(((product.compareAtPrice - selectedVariantPrice) / product.compareAtPrice) * 100)}% OFF
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {product.description && (
                            <div className="pd-description">
                                <h3>Product Details</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {colorValues.length > 0 && (
                            <div className="pd-option-selector">
                                <div className="pd-option-header">
                                    <h3>{colorOption?.title || 'Color'}</h3>
                                    {selectedColor && <span>{selectedColor}</span>}
                                </div>
                                <div className="pd-color-options">
                                    {colorValues.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`pd-color-btn ${selectedColor === color ? 'selected' : ''}`}
                                            onClick={() => setSelectedColor(color)}
                                            aria-pressed={selectedColor === color}
                                        >
                                            <span className="pd-color-swatch" style={getColorSwatchStyle(color)} aria-hidden="true"></span>
                                            <span>{color}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sizeValues.length > 0 && (
                            <div className="pd-size-selector">
                                <div className="pd-option-header">
                                    <h3>{sizeOption?.title || 'Size'}</h3>
                                    {selectedSize && <span>{selectedSize}</span>}
                                </div>
                                <div className="pd-size-options">
                                    {sizeValues.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            className={`pd-size-btn ${selectedSize === size ? 'selected' : ''}`}
                                            onClick={() => setSelectedSize(size)}
                                            aria-pressed={selectedSize === size}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pd-quantity-selector">
                            <h3>Quantity</h3>
                            <div className="pd-quantity-controls">
                                <button onClick={decreaseQuantity} disabled={quantity <= 1}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                                        <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                                <span className="pd-quantity-display">{quantity}</span>
                                <button onClick={increaseQuantity}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                                        <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button className="pd-add-to-cart-btn" onClick={handleAddToCart}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M2 2h1.5l1.72 9.45c.12.66.7 1.15 1.37 1.15h8.78c.64 0 1.21-.47 1.35-1.1L18 5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="8" cy="18" r="1" fill="currentColor" />
                                <circle cx="16" cy="18" r="1" fill="currentColor" />
                            </svg>
                            Add to Cart
                        </button>
                    </div>
                </section>

                    <section className="pd-story-section">
                    <div className="pd-story-text">
                        <p className="pd-section-kicker">Designer Note</p>
                        <h2>Built for statements, not seasons.</h2>
                        <p>
                            This piece is designed as wearable ritual: structured silhouette, elevated texture,
                            and a calm dark palette that carries from street to studio.
                        </p>
                        <p>
                            Every detail is tuned for long-term wear with premium finishing and an intentional oversized stance.
                        </p>
                    </div>
                    <div className="pd-story-image">
                        <img
                            src={secondaryImage}
                            alt={`${product.title} detail`}
                            onError={(e) => {
                                e.target.src = '/backgrounds/2.png'
                            }}
                        />
                    </div>
                    </section>
                </div>

                <section className="pd-video-section">
                    <div className="pd-video-frame">
                        <div className="pd-video-overlay">
                            <p className="pd-video-kicker">Motion Editorial</p>
                            <h2>Experience the drop in motion</h2>
                        </div>
                        <video
                            src="/video/intro.webm"
                            playsInline
                            muted
                            loop
                            autoPlay
                            preload="metadata"
                            poster={activeImage}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </section>

                <div className="pd-theme-shift">
                    <div className="pd-smoke-bg" aria-hidden="true">
                        <SmokeBackground smokeColor="#b88a4f" />
                    </div>
                    <section className="pd-atelier-hero">
                        <div className="pd-atelier-text">
                            <p className="pd-section-kicker">OWN KARMA ATELIER</p>
                            <h2>Luxury streetwear system for modern wardrobes.</h2>
                            <p>
                                Signature hoodies, heavyweight layers, and refined trims designed for high rotation.
                                The visual language is minimal, but every element is precision-led.
                            </p>
                            <div className="pd-atelier-tags">
                                <span>Heavyweight Cotton</span>
                                <span>Oversized Fit</span>
                                <span>Limited Drop</span>
                            </div>
                        </div>

                        <div className="pd-atelier-media">
                            <div className="pd-atelier-frame" style={{ '--atelier-image': `url(${activeImage})` }}>
                                <div className="pd-atelier-image"></div>
                            </div>
                        </div>
                    </section>

                    <section className="pd-atelier-feature">
                        <div className="pd-atelier-media">
                            <div className="pd-atelier-frame is-tall" style={{ '--atelier-image': `url(${secondaryImage})` }}>
                                <div className="pd-atelier-image"></div>
                                <div className="pd-atelier-sketch"></div>
                            </div>
                        </div>

                        <div className="pd-atelier-text">
                            <p className="pd-section-kicker">ENGINEERING</p>
                            <h2>Built for movement, structured for statement.</h2>
                            <p>
                                Every panel is cut for drape and resilience. Premium fleece with a brushed interior
                                anchors the silhouette, while reinforced seams keep structure over time.
                            </p>
                            <p className="pd-atelier-note">Drop-tested for fit. Calibrated for all-season layering.</p>
                        </div>
                    </section>

                    <div className="pd-atelier-specs">
                        <div className="pd-atelier-spec">
                            <span>Fabric</span>
                            <strong>Heavyweight Fleece</strong>
                        </div>
                        <div className="pd-atelier-spec">
                            <span>Fit</span>
                            <strong>Oversized Cut</strong>
                        </div>
                        <div className="pd-atelier-spec">
                            <span>Craft</span>
                            <strong>Reinforced Stitch</strong>
                        </div>
                        <div className="pd-atelier-spec">
                            <span>Drop</span>
                            <strong>Limited Edition</strong>
                        </div>
                    </div>
                </div>

                <section className="pd-accordion-section">
                    <p className="pd-section-kicker">QnA / Specifications</p>
                    <h2>Everything you need to know</h2>

                    <div className="pd-accordion-list">
                        {accordionItems.map((item, index) => {
                            const isOpen = openSpecIndex === index
                            return (
                                <div key={item.title} className={`pd-accordion-item ${isOpen ? 'open' : ''}`}>
                                    <button
                                        type="button"
                                        className="pd-accordion-trigger"
                                        onClick={() => setOpenSpecIndex(isOpen ? -1 : index)}
                                        aria-expanded={isOpen}
                                    >
                                        <span>{item.title}</span>
                                        <svg className="pd-accordion-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <div className="pd-accordion-content">
                                        <p>{item.content}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                <section className="pd-trust-section">
                    <div className="pd-trust-grid">
                        {trustItems.map((item, index) => (
                            <article key={item.title} className="pd-trust-card">
                                <div className="pd-trust-icon">
                                    <TrustIcon index={index} />
                                </div>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>

            <SiteFooter />
        </div>
    )
}

export default ProductDetailPage
