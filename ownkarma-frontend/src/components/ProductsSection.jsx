import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../lib/medusa-api';
import '../styles/products-section.css';

/**
 * Reusable Products Section Component
 * Fetches and displays products from Medusa backend based on collection handle
 * 
 * @param {string} pageName - The collection handle (e.g., 'divine', 'karma-eye', 'destiny', 'broken-hourglass')
 * @param {string} collectionId - Optional Medusa collection ID (if you have it)
 * @param {string} title - Section title (e.g., "Divine Collection")
 * @param {string} subtitle - Section subtitle (e.g., "Curated pieces for conscious living")
 */
const ProductsSection = ({ pageName, collectionId, title, subtitle }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [pageName, collectionId]);

    const getDisplayPrice = (product) => {
        const variants = product?.variants || []

        for (const variant of variants) {
            const prices = variant?.prices || []
            const inrPrice = prices.find((p) => (p?.currency_code || '').toLowerCase() === 'inr')
            if (inrPrice?.amount != null) {
                return inrPrice.amount / 100
            }
        }

        for (const variant of variants) {
            const calculatedAmount = variant?.calculated_price?.calculated_amount
            if (calculatedAmount != null) {
                return calculatedAmount / 100
            }
        }

        for (const variant of variants) {
            const firstPrice = variant?.prices?.[0]
            if (firstPrice?.amount != null) {
                return firstPrice.amount / 100
            }
        }

        return 0
    }

    const fetchProducts = async () => {
        try {
            console.log(`Fetching products for collection: ${pageName || collectionId}...`);

            let response;

            // Fetch products using collection handle (pageName) or collection ID
            if (collectionId) {
                // Use collection ID directly
                response = await productsAPI.getByCollection(collectionId);
            } else if (pageName) {
                // Use collection handle (e.g., "divine", "karma-eye")
                response = await productsAPI.getByCollectionHandle(pageName);
            } else {
                // Fetch all products
                response = await productsAPI.getAll();
            }

            // Check if response was successful
            if (!response.success) {
                console.warn(response.message || 'Failed to fetch products');
                setProducts([]);
                setLoading(false);
                return;
            }

            // Map Medusa products to your UI format
            const mappedProducts = (response.products || []).map(product => ({
                _id: product.id,
                title: product.title,
                tagline: product.subtitle || product.metadata?.tagline || '',
                thumbnail: product.thumbnail,
                images: product.images?.map(img => ({ url: img.url })) || [],
                price: getDisplayPrice(product),
                compareAtPrice: product.metadata?.compareAtPrice || null,
                glowColor: product.metadata?.glow || '255, 255, 255',
                themeColor: product.metadata?.color || '#646464ff'
            }));

            console.log(`Found ${mappedProducts.length} products in collection`);
            setProducts(mappedProducts);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error.message || 'Failed to load products');
            setLoading(false);
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    return (
        <section className="products-section">
            <div className="products-container">
                <div className="products-header">
                    <h2>{title}</h2>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                {loading ? (
                    <div className="products-loading">
                        <p>Loading products...</p>
                    </div>
                ) : error ? (
                    <div className="products-error">
                        <p style={{ color: '#ff6b6b' }}>Error: {error}</p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '1rem' }}>
                            Check browser console for details
                        </p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products && products.length > 0 ? (
                            products.map((product) => {
                                const image = product.images?.[0]?.url || product.thumbnail;

                                return (
                                    <div
                                        key={product._id}
                                        className="product-card"
                                        onClick={() => handleProductClick(product._id)}
                                        style={{
                                            '--product-glow': product.glowColor || '255, 255, 255',
                                            '--product-theme': product.themeColor || '#646464ff'
                                        }}
                                    >
                                        <div className="product-image">
                                            {image ? (
                                                <img src={image} alt={product.title} />
                                            ) : (
                                                <div className="product-image-placeholder">
                                                    <span>No Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <h3 className="product-title">{product.title}</h3>
                                            {product.tagline && (
                                                <p className="product-subtitle">{product.tagline}</p>
                                            )}
                                            {product.price && (
                                                <div className="product-pricing">
                                                    <span className="product-price">
                                                        ₹{product.price.toLocaleString('en-IN')}
                                                    </span>
                                                    {product.compareAtPrice && (
                                                        <span className="product-compare-price">
                                                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="products-empty">
                                <p>No products in this collection yet.</p>
                                <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '0.5rem' }}>
                                    Add products to the "{pageName}" collection in Medusa Admin.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductsSection;
