import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../styles/site-footer.css'

function SiteFooter() {
    const location = useLocation()

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <div className="site-footer-brand">
                    <p className="site-footer-kicker">OWN KARMA</p>
                    <h3>Luxury streetwear crafted with intention.</h3>
                </div>

                <nav className="site-footer-links" aria-label="Footer">
                    <Link to="/products">Products</Link>
                    <Link to="/cart" state={{ from: `${location.pathname}${location.search}` }}>Cart</Link>
                    <Link to="/profile">Profile</Link>
                </nav>

                <p className="site-footer-copy">Copyright {new Date().getFullYear()} Own Karma. All rights reserved.</p>
            </div>
        </footer>
    )
}

export default SiteFooter
