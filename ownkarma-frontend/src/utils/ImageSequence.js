// Global cache for ImageSequence instances
export const sequenceCache = {}
const imageAssetCache = new Map()

export function preloadImage(src) {
    const encodedSrc = encodeURI(src)
    const cached = imageAssetCache.get(encodedSrc)

    if (cached?.status === 'loaded' && cached.img) {
        return Promise.resolve(cached.img)
    }

    if (cached?.status === 'loading' && cached.promise) {
        return cached.promise
    }

    const img = new Image()
    const promise = new Promise((resolve, reject) => {
        img.onload = () => {
            imageAssetCache.set(encodedSrc, { status: 'loaded', img })
            resolve(img)
        }

        img.onerror = (error) => {
            imageAssetCache.delete(encodedSrc)
            reject(error)
        }
    })

    imageAssetCache.set(encodedSrc, { status: 'loading', promise })
    img.src = encodedSrc
    return promise
}

export class ImageSequence {
    static getSequence(key, canvas, folder, totalFrames, prefix, frameStep, onProgress, extension, crop = null) {
        if (sequenceCache[key]) {
            const seq = sequenceCache[key]
            seq.setCanvas(canvas) // Re-bind to new canvas element
            return seq
        }

        const newSeq = new ImageSequence(canvas, folder, totalFrames, prefix, frameStep, onProgress, extension, crop)
        sequenceCache[key] = newSeq
        return newSeq
    }

    constructor(canvas, folder, totalFrames, prefix = 'frame_', frameStep = 1, onProgress = null, extension = '.jpg', crop = null) {
        this.folder = folder
        this.totalFrames = totalFrames
        this.prefix = prefix
        this.extension = extension
        this.frameStep = frameStep
        this.crop = crop
        this.images = []
        this.frame = { index: 0 }
        this.loadedCount = 0
        this.actualFrameCount = 0
        this.onProgress = onProgress
        this.lastRenderedIndex = -1 // Track last render

        // Loading State
        this.loadingQueue = []
        this.loadingInProgress = new Set()
        this.maxConcurrentLoads = 12
        this.preloadRadius = 50

        // Initialize Context
        this.setCanvas(canvas)

        // Start independent loading immediately
        this.initializeLoading()
    }

    setCanvas(canvas) {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler)
        }

        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true })
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = 'high'

        // Bind resize handler to instance so we can remove it
        this.resizeHandler = () => this.resize()
        window.addEventListener('resize', this.resizeHandler)

        // Force resize and render on new canvas
        this.resize()
    }

    initializeLoading() {
        if (this.images.length > 0) return // Already initialized

        // Create placeholder array
        for (let i = 0; i < this.totalFrames; i += this.frameStep) {
            this.images.push(null)
            this.actualFrameCount++
        }

        // Priority loading logic
        const criticalFrames = [0, 1, 2, 3, 4, 5]
        const keyFrames = []
        for (let i = 10; i < this.actualFrameCount; i += 10) {
            keyFrames.push(i)
        }

        const remainingFrames = []
        for (let i = 0; i < this.actualFrameCount; i++) {
            if (!criticalFrames.includes(i) && !keyFrames.includes(i)) {
                remainingFrames.push(i)
            }
        }

        this.loadingQueue = [...criticalFrames, ...keyFrames, ...remainingFrames]
        this.processLoadingQueue()
    }

    processLoadingQueue() {
        while (this.loadingInProgress.size < this.maxConcurrentLoads && this.loadingQueue.length > 0) {
            const frameIndex = this.loadingQueue.shift()
            this.loadImage(frameIndex)
        }
    }

    loadImage(frameIndex) {
        if (this.images[frameIndex] !== null || this.loadingInProgress.has(frameIndex)) return

        this.loadingInProgress.add(frameIndex)
        const indexStr = (frameIndex * this.frameStep).toString().padStart(4, '0')
        const folderPath = this.folder.startsWith('/') ? this.folder : `/images/${this.folder}`
        const imgPath = `${folderPath}/${this.prefix}${indexStr}${this.extension}`

        preloadImage(imgPath).then((img) => {
            this.images[frameIndex] = img
            this.loadedCount++
            this.loadingInProgress.delete(frameIndex)

            if (this.onProgress) {
                const progress = (this.loadedCount / this.actualFrameCount) * 100
                this.onProgress(progress, this.loadedCount, this.actualFrameCount)
            }

            // If we just loaded the current frame or neighbor, force a re-render
            const currentFrameIndex = Math.floor(this.frame.index)
            if (Math.abs(frameIndex - currentFrameIndex) <= 2) {
                this.render(true) // Force render when new relevant asset arrives
            }

            this.processLoadingQueue()
        }).catch(() => {
            this.loadingInProgress.delete(frameIndex)
            this.processLoadingQueue()
        })
    }

    preloadNearbyFrames(currentIndex) {
        const start = Math.max(0, currentIndex - this.preloadRadius)
        const end = Math.min(this.actualFrameCount - 1, currentIndex + this.preloadRadius)

        for (let i = start; i <= end; i++) {
            if (this.images[i] === null && !this.loadingInProgress.has(i)) {
                this.loadingQueue.unshift(i)
            }
        }
        this.processLoadingQueue()
    }

    resize() {
        if (!this.canvas) return
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.render(true) // Force render on resize
    }

    // Main API call from GSAP loop
    // Now accepts force flag to bypass optimization
    render(force = false) {
        if (this.isRendering) return
        this.isRendering = true

        requestAnimationFrame(() => {
            this._renderFrame(force)
            this.isRendering = false
        })
    }

    _renderFrame(force) {
        let idx = Math.floor(this.frame.index)
        if (idx >= this.actualFrameCount) idx = this.actualFrameCount - 1
        if (idx < 0) idx = 0

        // OPTIMIZATION: Only draw if frame changed or forced
        if (!force && idx === this.lastRenderedIndex) {
            return
        }

        this.lastRenderedIndex = idx
        this.preloadNearbyFrames(idx)

        const img = this.images[idx]

        // If target frame not loaded, find nearest loaded frame
        if (!img || !img.complete || img.naturalWidth === 0) {
            let nearestImg = null
            let minDistance = Infinity

            for (let offset = 1; offset < 30; offset++) {
                const beforeIdx = idx - offset
                const afterIdx = idx + offset

                if (beforeIdx >= 0 && this.images[beforeIdx]?.complete) {
                    if (offset < minDistance) {
                        minDistance = offset
                        nearestImg = this.images[beforeIdx]
                    }
                }
                if (afterIdx < this.actualFrameCount && this.images[afterIdx]?.complete) {
                    if (offset < minDistance) {
                        minDistance = offset
                        nearestImg = this.images[afterIdx]
                    }
                }
                if (nearestImg) break
            }

            if (nearestImg) this.drawImage(nearestImg)
            return
        }

        this.drawImage(img)
    }

    getCropRect(img) {
        if (!this.crop) {
            return { x: 0, y: 0, w: img.width, h: img.height }
        }

        const { x, y, w, h, top = 0, bottom = 0, left = 0, right = 0 } = this.crop
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h)) {
            return { x, y, w, h }
        }

        const cropW = Math.max(1, img.width - left - right)
        const cropH = Math.max(1, img.height - top - bottom)
        return { x: left, y: top, w: cropW, h: cropH }
    }

    drawImage(img) {
        const cvsW = this.canvas.width
        const cvsH = this.canvas.height
        const crop = this.getCropRect(img)
        const imgRatio = crop.w / crop.h
        const canvasRatio = cvsW / cvsH

        let drawW, drawH

        if (canvasRatio > imgRatio) {
            drawW = cvsW
            drawH = cvsW / imgRatio
        } else {
            drawH = cvsH
            drawW = cvsH * imgRatio
        }

        const drawX = (cvsW - drawW) / 2
        const drawY = (cvsH - drawH) / 2

        this.ctx.clearRect(0, 0, cvsW, cvsH)
        this.ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, drawX, drawY, drawW, drawH)
    }
}
