import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircularGallery } from '../components/ui/circular-gallery'
import '@google/model-viewer'
import '../styles/products.css'
import '../styles/circular-gallery.css'

const chapterGalleryItems = [
    {
        common: 'Divine',
        binomial: 'Beyond Human Understanding',
        route: '/divine',
        photo: {
            url: '/backgrounds/1.png',
            text: 'Divine chapter card',
            by: 'Own Karma',
        },
        glow: '142, 198, 255',
    },
    {
        common: "Karma's Eye",
        binomial: 'Witness To Every Action',
        route: '/karma-eye',
        photo: {
            url: '/backgrounds/2.png',
            text: "Karma's Eye chapter card",
            by: 'Own Karma',
        },
        glow: '246, 224, 198',
    },
    {
        common: 'Destiny',
        binomial: 'Written In The Stars',
        route: '/destiny',
        photo: {
            url: '/backgrounds/3.png',
            text: 'Destiny chapter card',
            by: 'Own Karma',
        },
        glow: '255, 208, 110',
    },
    {
        common: 'Broken Hourglass',
        binomial: "Time's Final Surrender",
        route: '/broken-hourglass',
        photo: {
            url: '/backgrounds/4.png',
            text: 'Broken Hourglass chapter card',
            by: 'Own Karma',
        },
        glow: '160, 112, 82',
    },
]

function ProductsPage() {
    const navigate = useNavigate()
    const modelViewerRef = useRef(null)

    // Lock page scroll
    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow
        const previousHtmlOverflow = document.documentElement.style.overflow
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousBodyOverflow
            document.documentElement.style.overflow = previousHtmlOverflow
        }
    }, [])

    // Apply shiny chromium material once the model loads
    useEffect(() => {
        const modelViewer = modelViewerRef.current
        if (!modelViewer) return

        const applyChromiumMaterial = () => {
            const model = modelViewer.model
            if (!model?.materials?.length) return

            model.materials.forEach((material) => {
                const pbr = material.pbrMetallicRoughness
                if (!pbr) return
                if (typeof pbr.setBaseColorFactor === 'function') {
                    pbr.setBaseColorFactor([0.84, 0.87, 0.92, 1.0])
                }
                if (typeof pbr.setMetallicFactor === 'function') {
                    pbr.setMetallicFactor(1.0)
                }
                if (typeof pbr.setRoughnessFactor === 'function') {
                    pbr.setRoughnessFactor(0.10)
                }
            })
        }

        modelViewer.addEventListener('load', applyChromiumMaterial)
        applyChromiumMaterial()

        return () => modelViewer.removeEventListener('load', applyChromiumMaterial)
    }, [])


    return (
        <div className="products-page-gallery-shell">
            <div className="products-page-gallery-sticky">

                {/* ── 3D model — silver, stationary ── */}
                <model-viewer
                    ref={modelViewerRef}
                    src="/model/angel_silver_version.glb"
                    alt="Angel silver 3D model"
                    touch-action="pan-y"
                    interaction-prompt="none"
                    environment-image="legacy"
                    exposure="1.3"
                    shadow-intensity="1.4"
                    shadow-softness="0.7"
                    camera-orbit="0deg 80deg auto"
                    field-of-view="19deg"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'clamp(640px, 64vw, 1020px)',
                        height: 'clamp(820px, 95vh, 2040px)',
                        zIndex: 1,
                        pointerEvents: 'none',
                        '--progress-bar-height': '0px',
                        '--poster-color': 'transparent',
                        filter: 'contrast(1.1) brightness(1.08) saturate(0.3) drop-shadow(0 0 30px rgba(210,220,235,0.55)) drop-shadow(0 0 80px rgba(190,205,225,0.25))',
                    }}
                />
                {/* ── Card gallery — drives model rotation via onRotationTick ── */}
                <div className="products-page-gallery-canvas">
                    <CircularGallery
                        items={chapterGalleryItems}
                        radius={500}
                        autoRotateSpeed={0.025}
                        wheelRotateSpeed={0.012}
                        onItemClick={(item) => navigate(item.route)}
                    />
                </div>

            </div>
        </div>
    )
}

export default ProductsPage
