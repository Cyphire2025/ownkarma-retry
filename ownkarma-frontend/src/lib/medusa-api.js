import Medusa from "@medusajs/js-sdk"

const MEDUSA_BACKEND_URL = import.meta.env.VITE_MEDUSA_URL || 'http://localhost:9000'
const PUBLISHABLE_API_KEY = import.meta.env.VITE_PUBLISHABLE_KEY

if (!PUBLISHABLE_API_KEY) {
    console.warn("Missing VITE_PUBLISHABLE_KEY - backend features will not work")
}

if (import.meta.env.PROD && !MEDUSA_BACKEND_URL.startsWith("https://")) {
    console.warn("[security] VITE_MEDUSA_URL should use HTTPS in production")
}

console.log("Initializing Medusa SDK with:", MEDUSA_BACKEND_URL)

export const sdk = new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: !import.meta.env.PROD,
    publishableKey: PUBLISHABLE_API_KEY,
    auth: {
        type: "jwt",
        jwtTokenStorageMethod: "local",
        jwtTokenStorageKey: "ok_auth_token",
    },
})

let hasAuthState = false

// Helper to handle API errors consistently
const handleError = (error, defaultMessage) => {
    console.error(defaultMessage, error)
    if (error.type === 'invalid_request_error') {
        console.error("Validation errors:", error.message)
    }

    const extractedMessage =
        error?.response?.data?.message ||
        error?.cause?.message ||
        error?.message ||
        defaultMessage

    return {
        success: false,
        message: extractedMessage,
        originalError: error
    }
}

const getAuthTokenFromResult = (result) => {
    if (typeof result === "string" && result.trim()) {
        return result
    }

    if (result && typeof result === "object" && "token" in result && typeof result.token === "string" && result.token.trim()) {
        return result.token
    }

    return null
}

export const customersAPI = {
    create: async (customerData) => {
        try {
            // 1. Register with email/password (Identity)
            const registerResult = await sdk.auth.register("customer", "emailpass", {
                email: customerData.email,
                password: customerData.password,
            })

            const token = getAuthTokenFromResult(registerResult)
            if (!token) {
                return {
                    success: false,
                    message: "Failed to create account: no auth token returned by Medusa",
                }
            }

            // 2. Create customer profile using auth state set by register
            const { customer } = await sdk.store.customer.create(
                {
                    email: customerData.email,
                    first_name: customerData.first_name,
                    last_name: customerData.last_name,
                    phone: customerData.phone,
                }
            )

            hasAuthState = true
            return { success: true, customer }
        } catch (error) {
            return handleError(error, "Failed to create account")
        }
    },

    login: async (email, password) => {
        try {
            await sdk.auth.logout().catch(() => null)

            const loginResult = await sdk.auth.login("customer", "emailpass", {
                email,
                password,
            })

            if (loginResult && typeof loginResult === "object" && "location" in loginResult) {
                return {
                    success: false,
                    message: "This login flow requires redirect authentication, which is not configured in this UI yet.",
                }
            }

            const token = getAuthTokenFromResult(loginResult)
            if (!token) {
                return {
                    success: false,
                    message: "Login failed: no auth token returned by Medusa",
                }
            }

            const { customer } = await sdk.store.customer.retrieve()

            hasAuthState = true
            return { success: true, customer }
        } catch (error) {
            await sdk.auth.logout().catch(() => null)
            hasAuthState = false
            return handleError(error, "Login failed")
        }
    },

    retrieve: async () => {
        try {
            const { customer } = await sdk.store.customer.retrieve()
            hasAuthState = true
            return { success: true, customer }
        } catch (error) {
            if (error?.status === 401 || error?.statusCode === 401 || error?.response?.status === 401) {
                await sdk.auth.logout().catch(() => null)
                hasAuthState = false
            }
            return handleError(error, "Failed to retrieve session")
        }
    },

    update: async (customerData) => {
        try {
            const { customer } = await sdk.store.customer.update(customerData)
            return { success: true, customer }
        } catch (error) {
            return handleError(error, "Failed to update profile")
        }
    },

    logout: async () => {
        try {
            await sdk.auth.logout()
            hasAuthState = false
            return { success: true }
        } catch (error) {
            return handleError(error, "Logout failed")
        }
    }
}

export const productsAPI = {
    getAll: async () => {
        try {
            const { products } = await sdk.store.product.list({
                fields: "id,title,subtitle,thumbnail,metadata,*images,*variants,*variants.prices"
            })
            return { success: true, products }
        } catch (error) {
            return handleError(error, "Failed to fetch products")
        }
    },

    getById: async (id) => {
        try {
            const { product } = await sdk.store.product.retrieve(id, {
                fields: "id,title,subtitle,description,thumbnail,metadata,*images,*options,*variants,*variants.prices,*variants.options,*variants.images"
            })
            return { success: true, product }
        } catch (error) {
            return handleError(error, "Failed to fetch product")
        }
    },

    getByCollection: async (collectionId) => {
        try {
            const { products } = await sdk.store.product.list({
                collection_id: collectionId,
                fields: "id,title,subtitle,thumbnail,metadata,*images,*variants,*variants.prices"
            })
            return { success: true, products }
        } catch (error) {
            return handleError(error, "Failed to fetch collection products")
        }
    },

    // Note: V2 SDK filtration is powerful, we can filter directly in list
    getByCollectionHandle: async (handle) => {
        try {
            // 1. Get collection by handle
            const { collections } = await sdk.store.collection.list({
                handle: handle,
                limit: 1
            })

            if (!collections.length) return { success: false, products: [], message: "Collection not found" }

            // 2. Get products in that collection
            const { products } = await sdk.store.product.list({
                collection_id: collections[0].id,
                fields: "id,title,subtitle,thumbnail,metadata,*images,*variants,*variants.prices"
            })

            return { success: true, products }
        } catch (error) {
            return handleError(error, "Failed to fetch collection products")
        }
    }
}

export const ordersAPI = {
    list: async () => {
        try {
            const { orders } = await sdk.store.order.list({
                fields: "id,display_id,status,fulfillment_status,payment_status,currency_code,subtotal,shipping_total,tax_total,discount_total,total,email,created_at,*items,*fulfillments,*fulfillments.tracking_links,*shipping_address"
            })
            return { success: true, orders: orders || [] }
        } catch (error) {
            return handleError(error, "Failed to fetch orders")
        }
    },

    retrieve: async (id) => {
        try {
            const { order } = await sdk.store.order.retrieve(id, {
                fields: "id,display_id,status,fulfillment_status,payment_status,currency_code,subtotal,shipping_total,tax_total,discount_total,total,email,created_at,*items,*fulfillments,*fulfillments.tracking_links,*shipping_address"
            })
            return { success: true, order }
        } catch (error) {
            return handleError(error, "Failed to fetch order")
        }
    }
}

