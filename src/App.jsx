import { useState, useEffect } from 'react';
import "./App.css";
import soupealoignon    from "./templates/soupealoignon.png";
import CroissantauJambon from "./templates/CroissantauJambon.png";
import QuicheLorraine   from "./templates/QuicheLorraine.png";
import BoeufBourguignon from "./templates/BoeufBourguignon.png";
import Ratatouille      from "./templates/Ratatouille.png";
import PouletProvencal  from "./templates/PouletProvencal.png";
import CrêpesSuzette    from "./templates/CrêpesSuzette.png";

import galleryone   from "./templates/galleryone.png";
import gallerysecond from "./templates/gallerysecond.png";
import gallerythree from "./templates/gallerythree.png";

import { FaShoppingCart, FaPizzaSlice, FaInstagram, FaFacebookF, FaTwitter, FaTimes, FaPlus, FaMinus, FaTrash, FaBars } from 'react-icons/fa';

const galleryimg = [galleryone, gallerysecond, gallerythree];

// Maps imageKey stored in MongoDB → locally bundled image
const imageMap = {
  soupealoignon,
  CroissantauJambon,
  QuicheLorraine,
  BoeufBourguignon,
  Ratatouille,
  PouletProvencal,
  'CrêpesSuzette': CrêpesSuzette,
};

const API = import.meta.env.VITE_API_BASE_URL ?? '';

function getSessionId() {
  let id = localStorage.getItem('luigis_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('luigis_session', id);
  }
  return id;
}

function toDBItem(item) {
  return {
    menuItemId: item.id,
    name:       item.name,
    price:      item.price,
    quantity:   item.quantity,
    imageKey:   item.imageKey,
  };
}

export default function App() {
  const [menuItems,  setMenuItems]  = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [curr_cart,  setCurr_Cart]  = useState([]);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [lastOrder,  setLastOrder]  = useState(null);
  const [sessionId]                 = useState(getSessionId);

  // Fetch menu from backend on mount
  useEffect(() => {
    fetch(`${API}/api/menu`)
      .then(r => r.json())
      .then(data => {
        setMenuItems(data.map(item => ({
          ...item,
          id:    item._id,
          image: imageMap[item.imageKey] ?? null,
        })));
      })
      .catch(err => console.error('Failed to load menu:', err))
      .finally(() => setMenuLoading(false));
  }, []);

  // Sync cart to DB whenever it changes (skip empty to avoid race condition on mount)
  useEffect(() => {
    if (curr_cart.length === 0) return;
    fetch(`${API}/api/cart/${sessionId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items: curr_cart.map(toDBItem) }),
    }).catch(() => {});
  }, [curr_cart, sessionId]);

  function addToCart(item) {
    setCurr_Cart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id) {
    setCurr_Cart(prev => prev.filter(i => i.id !== id));
  }

  function updateQuantity(id, delta) {
    setCurr_Cart(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
          .filter(i => i.quantity > 0)
    );
  }

  async function checkout() {
    const total = curr_cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: curr_cart.map(toDBItem), total }),
      });
      const order = await res.json();
      setLastOrder(order);
      setCurr_Cart([]);
      setCartOpen(false);
      // Clear persisted cart from DB
      fetch(`${API}/api/cart/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  }

  return (
    <div>
      <Navigation current_cart={curr_cart} onCartClick={() => setCartOpen(true)} />
      <Home addToCart={addToCart} menuItems={menuItems} menuLoading={menuLoading} />
      <Footer />
      <CartDrawer
        cart={curr_cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={checkout}
      />
      {lastOrder && (
        <OrderConfirmation order={lastOrder} onClose={() => setLastOrder(null)} />
      )}
    </div>
  );
}

function Navigation({ current_cart, onCartClick }) {
  const totalItems = current_cart.reduce((sum, i) => sum + i.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() { setMenuOpen(false); }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <FaPizzaSlice className="navbar-logo-icon" />
        <span className="navbar-logo-text">Luigi's</span>
      </div>

      <div className={`navbar-links${menuOpen ? ' navbar-links-open' : ''}`}>
        <a href="#Home"    onClick={closeMenu}>Home</a>
        <a href="#Menu"    onClick={closeMenu}>Menu</a>
        <a href="#Gallery" onClick={closeMenu}>Gallery</a>
        <a href="#About"   onClick={closeMenu}>About</a>
        <a href="#Contact" onClick={closeMenu}>Contact</a>
      </div>

      <div className="navbar-right">
        <button className="navbar-cart" onClick={onCartClick}>
          <FaShoppingCart />
          {totalItems > 0 && <span className="navbar-cart-count">{totalItems}</span>}
        </button>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
}

function Home({ addToCart, menuItems, menuLoading }) {
  return (
    <div id="Home">
      <div className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Luigi's</h1>
          <p className="hero-subtitle">Authentic Italian Cuisine in the Heart of the City</p>
          <a href="#Menu" className="hero-btn">View Our Menu</a>
        </div>
      </div>

      <Menu_List addToCart={addToCart} menuItems={menuItems} menuLoading={menuLoading} />
      <Gallery />
      <About />
      <Contact />
    </div>
  );
}

function Menu_List({ addToCart, menuItems, menuLoading }) {
  return (
    <section className="menu-section" id="Menu">
      <h2 className="menu-title">Our Menu</h2>
      {menuLoading ? (
        <p className="menu-loading">Loading menu…</p>
      ) : (
        <ul className="menu-list">
          {menuItems.map(item => <Menu_Item key={item.id} food={item} addToCart={addToCart} />)}
        </ul>
      )}
    </section>
  );
}

function Menu_Item({ food, addToCart }) {
  return (
    <li className="menu-item">
      <img className="menu-item-img" src={food.image} alt={food.name} />
      <div className="menu-item-info">
        <div className="menu-item-header">
          <h3 className="menu-item-name">{food.name}</h3>
          <span className="menu-item-dots"></span>
          <span className="menu-item-price">${food.price.toFixed(2)}</span>
        </div>
        <p className="menu-item-ingredients">{food.ingredients}</p>
        <button className="menu-item-btn" onClick={() => addToCart(food)}>Add to cart</button>
      </div>
    </li>
  );
}

function Gallery() {
  const [current, setCurrent] = useState(0);
  function goLeft()  { setCurrent((current - 1 + galleryimg.length) % galleryimg.length); }
  function goRight() { setCurrent((current + 1) % galleryimg.length); }

  return (
    <div id="Gallery" className="gallery-window">
      <button className="gallery-btn gallery-btn-left"  onClick={goLeft}>←</button>
      <div className="gallery-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        <img src={galleryimg[0]} alt="Gallery 1" />
        <img src={galleryimg[1]} alt="Gallery 2" />
        <img src={galleryimg[2]} alt="Gallery 3" />
      </div>
      <button className="gallery-btn gallery-btn-right" onClick={goRight}>→</button>
    </div>
  );
}

function About() {
  return (
    <section id="About" className="about-section">
      <h2 className="about-title">About Us</h2>
      <div className="about-content">
        <div className="about-text">
          <h3>A Family Tradition Since 1987</h3>
          <p>
            Luigi's was founded by Luigi Marchetti, who brought his grandmother's recipes
            from Naples to the heart of New York City. For over 35 years, we have been
            serving authentic Italian cuisine made with fresh, locally sourced ingredients.
          </p>
          <p>
            Every dish tells a story — from our slow-cooked Boeuf Bourguignon to our
            delicate Crêpes Suzette. We believe food is best when shared, and every
            guest at Luigi's is treated like family.
          </p>
          <div className="about-stats">
            <div className="about-stat">
              <span className="about-stat-number">35+</span>
              <span className="about-stat-label">Years Open</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">12</span>
              <span className="about-stat-label">Signature Dishes</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">100%</span>
              <span className="about-stat-label">Fresh Ingredients</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="Contact" className="contact-section">
      <h2 className="contact-title">Contact Us</h2>
      <div className="contact-content">
        <form className="contact-form">
          <input type="text"  placeholder="Your Name"    className="contact-input" />
          <input type="email" placeholder="Your Email"   className="contact-input" />
          <textarea placeholder="Your Message" className="contact-textarea" rows="5" />
          <button type="submit" className="contact-btn">Send Message</button>
        </form>
        <iframe
          src="https://maps.google.com/maps?q=40.76288,-73.9822286&z=15&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          className="contact-map"
          title="Luigi's location"
        />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <FaPizzaSlice className="footer-icon" />
          <span className="footer-logo">Luigi's</span>
          <p className="footer-tagline">Authentic Italian Cuisine since 1987</p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <a href="#Home">Home</a>
          <a href="#Menu">Menu</a>
          <a href="#Gallery">Gallery</a>
          <a href="#About">About</a>
          <a href="#Contact">Contact</a>
        </div>

        <div className="footer-info">
          <h4>Hours</h4>
          <p>Mon – Thu: 11am – 10pm</p>
          <p>Fri – Sat: 11am – 11pm</p>
          <p>Sunday: 12pm – 9pm</p>
        </div>

        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="footer-social-icons">
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaTwitter /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Luigi's. All rights reserved.</p>
      </div>
    </footer>
  );
}

function CartDrawer({ cart, isOpen, onClose, onRemove, onUpdateQuantity, onCheckout }) {
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={onClose} />}
      <div className={`cart-drawer ${isOpen ? 'cart-drawer-open' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">Your Order</h2>
          <button className="cart-close" onClick={onClose}><FaTimes /></button>
        </div>

        {cart.length === 0 ? (
          <p className="cart-empty">Your cart is empty.</p>
        ) : (
          <>
            <ul className="cart-list">
              {cart.map(item => (
                <li key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                    <div className="cart-item-controls">
                      <button onClick={() => onUpdateQuantity(item.id, -1)}><FaMinus /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)}><FaPlus /></button>
                    </div>
                  </div>
                  <button className="cart-item-remove" onClick={() => onRemove(item.id)}>
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button className="cart-checkout-btn" onClick={onCheckout}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function OrderConfirmation({ order, onClose }) {
  return (
    <div className="order-overlay">
      <div className="order-modal">
        <h2 className="order-modal-title">Order Placed!</h2>
        <p className="order-modal-sub">Thank you for your order.</p>
        <div className="order-modal-id">
          <span>Order ID</span>
          <code>{order._id}</code>
        </div>
        <div className="order-modal-items">
          {order.items.map((item, i) => (
            <div key={i} className="order-modal-row">
              <span>{item.name} × {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="order-modal-total">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
        <button className="order-modal-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
