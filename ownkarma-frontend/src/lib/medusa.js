import Medusa from "@medusajs/medusa-js"

// Use environment variable in production, localhost in development
const BACKEND_URL = import.meta.env.VITE_MEDUSA_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = import.meta.env.VITE_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    console.warn("Missing VITE_PUBLISHABLE_KEY - backend features will not work")
}

if (import.meta.env.PROD && !BACKEND_URL.startsWith("https://")) {
    console.warn("[security] VITE_MEDUSA_URL should use HTTPS in production")
}

export const medusa = new Medusa({
    baseUrl: BACKEND_URL,
    maxRetries: 3,
    publishableApiKey: PUBLISHABLE_KEY
})

console.log('Medusa connected to:', BACKEND_URL)
