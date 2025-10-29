import React, { useState, useContext, useEffect } from "react";
import AuthContext from "../../context/AuthContext";
import ProductCard from "../../components/ProductCard";
import { productAPI } from "../../services/api";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productAPI.getAll();
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load products');
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const displayed = products.filter((p) => selectedCategory === "All" || p.category === selectedCategory);

  const addToCart = (p) => {
    const exist = cart.find(i => i._id === p._id);
    if (exist) {
      setCart(cart.map(i => i._id === p._id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...p, qty: 1, price: Number(p.price || 0) }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(i => i._id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0), 0);

  const changeQty = (id, delta) => {
    setCart(c => c.map(i => i._id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const performInventoryUpdate = async (cartItems) => {
    try {
      await Promise.all(cartItems.map((item) => {
        const currentQty = Number(item.quantity || 0);
        const purchased = Number(item.qty || 0);
        const newQty = Math.max(0, currentQty - purchased);
        return productAPI.update(item._id, { quantity: newQty });
      }));

      setProducts((prev) => prev.map((p) => {
        const bought = cartItems.find(ci => String(ci._id) === String(p._id));
        if (!bought) return p;
        return { ...p, quantity: Math.max(0, Number(p.quantity || 0) - Number(bought.qty || 0)) };
      }));

      return true;
    } catch (err) {
      console.error('Inventory update failed', err);
      return false;
    }
  };
  const applyCash = async (amount) => {
    const amt = Number(amount || 0);
    if (cart.length === 0) return alert('Cart empty');
      const change = amt - Number(total || 0);
    if (change < 0) return alert(`Insufficient cash. Need ₱${Number(Math.abs(change)).toFixed(2)}`);

    const ok = await performInventoryUpdate(cart);
    // if (!ok) {
    //   alert('Checkout failed: could not update inventory. Please try again.');
    //   return;
    // }

    alert(`Paid ₱${Number(amt).toFixed(2)}. Change: ₱${Number(change).toFixed(2)}. Checkout complete.`);
    clearCart();
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <h1>☕ LitePOS — Cashier</h1>
          <div className="subtitle">Quick ordering UI</div>
        </div>
        <div className="top-actions">
          <div className="user">Hi, {user?.username || user?.name || 'Guest'}</div>
          <button className="btn logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="pos-body">

        {/* CATEGORY PANEL */}
        <section className="category-panel" aria-label="Categories">
          <div className="cat-head">
            <h3>Categories</h3>
          </div>
          <ul className="cat-list">
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  className={`cat-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* PRODUCTS */}
        <section className="products-panel">
          <div className="panel-head">
            <h2>{selectedCategory}</h2>
            <div className="panel-note">Tap to add — large tiles for quick access</div>
          </div>

          <div className="products-grid">
            {displayed.map(p => (
              <div key={p._id} className="product-tile" onClick={() => addToCart(p)}>
                <ProductCard product={p} addToCart={addToCart} />
              </div>
            ))}
          </div>
        </section>

        {/* ORDER PANEL */}
        <section className="order-panel">
          <div className="order-header">
            <h3>Order</h3>
            <div className="order-actions">
              <button className="btn small" onClick={clearCart}>Clear</button>
            </div>
          </div>

          <div className="order-list">
            {cart.length === 0 && <div className="empty">Cart is empty — select items to start order</div>}
            {cart.map(item => (
              <div className="order-item" key={item._id}>
                <div className="oi-left">
                  <div className="oi-name">{item.name}</div>
                  <div className="oi-sub">₱{Number(item.price || 0).toFixed(2)} × {item.qty}</div>
                </div>
                <div className="oi-right">
                  <button className="qty-btn" onClick={() => changeQty(item._id, -1)}>-</button>
                  <div className="qty">{item.qty}</div>
                  <button className="qty-btn" onClick={() => changeQty(item._id, 1)}>+</button>
                  <button className="remove" onClick={() => removeFromCart(item._id)}>×</button>
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₱{Number(total || 0).toFixed(2)}</span>
            </div>
            <div className="quick-cash">
              <button className="btn quick" onClick={() => applyCash(100)}>₱100</button>
              <button className="btn quick" onClick={() => applyCash(200)}>₱200</button>
              <button className="btn quick" onClick={() => applyCash(500)}>₱500</button>
            </div>
            <button className="btn checkout" onClick={() => {
              if (cart.length === 0) return alert('Cart empty');
              const paid = prompt(`Total ₱${Number(total || 0).toFixed(2)} — enter cash received:`);
              const cash = parseFloat(paid);
              if (isNaN(cash)) return;
              applyCash(cash);
            }}>
              Checkout
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
