const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ""

let gaInitialized = false

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined"

const isGaEnabled = () => Boolean(GA_MEASUREMENT_ID)

const ensureGtag = () => {
    if (!isBrowser() || !isGaEnabled()) {
        return
    }

    window.dataLayer = window.dataLayer || []

    if (typeof window.gtag !== "function") {
        window.gtag = function gtag() {
            window.dataLayer.push(arguments)
        }
    }

    const hasScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)
    if (!hasScript) {
        const script = document.createElement("script")
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
        document.head.appendChild(script)
    }
}

export const initGoogleAnalytics = () => {
    if (gaInitialized || !isGaEnabled()) {
        return
    }

    ensureGtag()
    window.gtag("js", new Date())
    window.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false,
        debug_mode: Boolean(import.meta.env.DEV),
    })
    gaInitialized = true
}

export const getGaClientId = () => {
    if (!isBrowser()) return null

    const gaCookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("_ga="))
        ?.split("=")[1]

    if (!gaCookie) return null

    const parts = gaCookie.split(".")
    if (parts.length < 4) return null

    return parts.slice(-2).join(".")
}

export const trackGaEvent = (eventName, params = {}) => {
    if (!isGaEnabled()) {
        return
    }

    if (!gaInitialized) {
        initGoogleAnalytics()
    }

    if (typeof window.gtag === "function") {
        const eventParams = import.meta.env.DEV
            ? { ...params, debug_mode: true }
            : params
        window.gtag("event", eventName, eventParams)
    }
}

const toMajorUnit = (amount) => {
    return Number(((amount || 0) / 100).toFixed(2))
}

export const trackViewItem = (product, variant, currency = "INR") => {
    if (!product) return

    const priceAmount = variant?.prices?.find((p) => (p?.currency_code || "").toLowerCase() === currency.toLowerCase())?.amount
        ?? variant?.prices?.[0]?.amount
        ?? 0

    trackGaEvent("view_item", {
        currency: currency.toUpperCase(),
        value: toMajorUnit(priceAmount),
        items: [
            {
                item_id: variant?.id || product.id,
                item_name: product.title,
                item_variant: variant?.title || undefined,
                price: toMajorUnit(priceAmount),
                quantity: 1,
            },
        ],
    })
}

export const trackBeginCheckout = (cart) => {
    if (!cart) return

    const currency = (cart?.currency_code || "inr").toUpperCase()
    const items = (cart?.items || []).map((item) => ({
        item_id: item?.variant_id || item?.id,
        item_name: item?.product_title || item?.title || "Item",
        item_variant: item?.variant_title || undefined,
        price: toMajorUnit(item?.unit_price || 0),
        quantity: item?.quantity || 1,
    }))

    trackGaEvent("begin_checkout", {
        currency,
        value: toMajorUnit(cart?.total || 0),
        items,
    })
}

export const trackLogin = (method = "email") => {
    trackGaEvent("login", { method })
}

export const trackSignUp = (method = "email") => {
    trackGaEvent("sign_up", { method })
}
