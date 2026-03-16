import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { sdk } from '../lib/medusa-api'
import { getGaClientId } from '../lib/analytics'

const CartContext = createContext()
let hasLoggedBackendDown = false

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within CartProvider')
    }
    return context
}

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const hasInitialized = useRef(false)

    const isNetworkError = (error) => {
        return error?.name === "TypeError" || /Failed to fetch|ERR_CONNECTION_REFUSED/i.test(error?.message || "")
    }

    const getErrorMessage = (error, fallback) => {
        return (
            error?.response?.data?.message ||
            error?.cause?.message ||
            error?.message ||
            fallback
        )
    }

    const isCartCompleted = (cartLike) => {
        return Boolean(
            cartLike?.completed_at ||
            (cartLike?.status || "").toLowerCase() === "completed"
        )
    }

    const isCompletedCartError = (error) => {
        const message = getErrorMessage(error, "")
        return /already completed|cart.*completed/i.test(message)
    }

    const isCompatibleCart = (existingCart) => {
        const currencyCode = (existingCart?.currency_code || "").toLowerCase()
        return currencyCode === "inr"
    }

    // Initialize cart on mount
    useEffect(() => {
        if (hasInitialized.current) return
        hasInitialized.current = true

        const initCart = async () => {
            setLoading(true)
            const cartId = localStorage.getItem("medusa_cart_id")

            if (cartId) {
                try {
                    const { cart: existingCart } = await sdk.store.cart.retrieve(cartId, {
                        fields: "+items.thumbnail,+items.product.title"
                    })
                    if (!isCompatibleCart(existingCart) || isCartCompleted(existingCart)) {
                        localStorage.removeItem("medusa_cart_id")
                        await createNewCart()
                    } else {
                        setCart(existingCart)
                    }
                } catch (error) {
                    console.error("Failed to retrieve cart, creating new one:", error)
                    localStorage.removeItem("medusa_cart_id")
                    await createNewCart()
                }
            } else {
                await createNewCart()
            }
            setLoading(false)
        }

        initCart()
    }, [])

    const createNewCart = async () => {
        try {
            // Fetch regions to get a valid one
            const { regions } = await sdk.store.region.list({
                fields: "id,currency_code,*countries"
            })
            const preferredRegion =
                regions?.find((region) =>
                    region?.countries?.some((country) => country?.iso_2 === "in")
                ) ||
                regions?.find((region) => (region?.currency_code || "").toLowerCase() === "inr")

            const regionId = preferredRegion?.id || regions?.[0]?.id
            if (!regionId) {
                throw new Error("No store region available for cart creation")
            }

            const createBody = {
                region_id: regionId,
            }

            const gaClientId = getGaClientId()
            if (gaClientId) {
                createBody.metadata = {
                    ga_client_id: gaClientId,
                }
            }

            const { cart: newCart } = await sdk.store.cart.create(createBody)
            setCart(newCart)
            localStorage.setItem("medusa_cart_id", newCart.id)
            return newCart
        } catch (error) {
            if (isNetworkError(error) && !hasLoggedBackendDown) {
                console.error("Medusa backend is unreachable. Start backend on http://localhost:9000 and refresh.")
                hasLoggedBackendDown = true
            } else {
                console.error("Error creating cart:", error)
            }
            return null
        }
    }

    const ensureWritableCart = async (cartCandidate) => {
        if (!cartCandidate?.id) {
            return createNewCart()
        }

        try {
            const { cart: latestCart } = await sdk.store.cart.retrieve(cartCandidate.id, {
                fields: "+items.thumbnail,+items.product.title,+completed_at,+status,+currency_code"
            })

            if (!isCompatibleCart(latestCart) || isCartCompleted(latestCart)) {
                localStorage.removeItem("medusa_cart_id")
                return createNewCart()
            }

            setCart(latestCart)
            return latestCart
        } catch (error) {
            localStorage.removeItem("medusa_cart_id")
            return createNewCart()
        }
    }

    const addToCart = async (variantId, quantity = 1) => {
        let currentCart = await ensureWritableCart(cart)

        if (!currentCart?.id) {
            return {
                success: false,
                message: "Cart service is currently unavailable. Please try again in a moment.",
            }
        }

        try {
            const { cart: updatedCart } = await sdk.store.cart.createLineItem(currentCart.id, {
                variant_id: variantId,
                quantity,
            }, {
                fields: "+items.thumbnail,+items.product.title"
            })

            setCart(updatedCart)
            setIsOpen(true)
            return { success: true, cart: updatedCart }
        } catch (error) {
            if (isCompletedCartError(error)) {
                localStorage.removeItem("medusa_cart_id")
                const freshCart = await createNewCart()

                if (!freshCart?.id) {
                    return {
                        success: false,
                        message: "Your previous cart was already completed, and we couldn't create a new one.",
                    }
                }

                try {
                    const { cart: retriedCart } = await sdk.store.cart.createLineItem(freshCart.id, {
                        variant_id: variantId,
                        quantity,
                    }, {
                        fields: "+items.thumbnail,+items.product.title"
                    })

                    setCart(retriedCart)
                    setIsOpen(true)
                    return { success: true, cart: retriedCart }
                } catch (retryError) {
                    console.error("Error adding to fresh cart:", retryError)
                    return {
                        success: false,
                        message: getErrorMessage(retryError, "Failed to add item."),
                    }
                }
            }

            console.error("Error adding to cart:", error)
            return {
                success: false,
                message: getErrorMessage(error, "Failed to add item."),
            }
        }
    }

    const removeFromCart = async (lineItemId) => {
        if (!cart?.id) return

        try {
            const { cart: updatedCart } = await sdk.store.cart.deleteLineItem(cart.id, lineItemId, {
                fields: "+items.thumbnail,+items.product.title"
            })
            setCart(updatedCart)
        } catch (error) {
            console.error("Error removing item:", error)
        }
    }

    const updateQuantity = async (lineItemId, quantity) => {
        if (!cart?.id) return
        if (quantity <= 0) {
            return removeFromCart(lineItemId)
        }

        try {
            const { cart: updatedCart } = await sdk.store.cart.updateLineItem(cart.id, lineItemId, {
                quantity,
            }, {
                fields: "+items.thumbnail,+items.product.title"
            })
            setCart(updatedCart)
        } catch (error) {
            console.error("Error updating quantity:", error)
        }
    }

    const cartItems = cart?.items || []

    // Backend controls totals now
    const getCartTotal = () => {
        return cart?.total || 0
    }

    const getCartCount = () => {
        return cartItems.reduce((acc, item) => acc + item.quantity, 0)
    }

    const resetCart = async () => {
        localStorage.removeItem("medusa_cart_id")
        setCart(null)
        return createNewCart()
    }

    const value = {
        cart: cartItems, // Expose items array for frontend compatibility
        cartObj: cart,   // Expose full cart object for checkout
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartCount,
        resetCart,
        isOpen,
        setIsOpen,
        loading
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
