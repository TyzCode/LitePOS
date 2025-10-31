import React, { useState, useContext, useEffect } from "react";
import AuthContext from "../../context/AuthContext";
import ProductCard from "../../components/ProductCard";
import { productAPI, salesAPI, ordersAPI } from "../../services/api";
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
  const displayedInStock = displayed.filter(p => Number(p.quantity || 0) > 0);
  const displayedOutOfStock = displayed.filter(p => Number(p.quantity || 0) <= 0);

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
    setCart(c => c.map(i => (i._id === id ? { ...i, qty: Number(i.qty || 0) + Number(delta || 0) } : i))
      .filter(i => Number(i.qty || 0) > 0)
    );
  };

  const setQty = (id, qty) => {
    const n = parseInt(qty, 10);
    if (Number.isNaN(n)) return;
    if (n <= 0) {
      setCart(c => c.filter(i => i._id !== id));
      return;
    }
    setCart(c => c.map(i => (i._id === id ? { ...i, qty: n } : i)));
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

  const validateStockBeforeCheckout = async () => {
    try {
      const all = await productAPI.getAll();
      const idToProd = new Map((all?.data || []).map(p => [String(p._id), p]));
      const insufficient = [];
      for (const item of cart) {
        const latest = idToProd.get(String(item._id));
        const available = Number(latest?.quantity || 0);
        const request = Number(item.qty || 0);
        if (request > available) {
          insufficient.push({ name: item.name, request, available });
        }
      }
      if (insufficient.length > 0) {
        const lines = insufficient.map(s => `- ${s.name}: request ${s.request}, available ${s.available}`).join('\n');
        alert(`Not enough stock for some items:\n${lines}\n\nPlease adjust quantities and try again.`);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Stock validation failed', e);
      alert('Could not validate stock. Please try again.');
      return false;
    }
  };

  const applyCash = async (amount) => {
    const amt = Number(amount || 0);
    if (cart.length === 0) return alert('Cart empty');
    const change = amt - Number(total || 0);
    if (change < 0) return alert(`Insufficient cash. Need ₱${Number(Math.abs(change)).toFixed(2)}`);

    const valid = await validateStockBeforeCheckout();
    if (!valid) return;

    const ok = await performInventoryUpdate(cart);
    // if (!ok) {
    //   alert('Checkout failed: could not update inventory. Please try again.');
    //   return;
    // }

    try {
      await salesAPI.record({ amount: Number(total || 0), items: cart, cashierId: user?._id || null });
      await ordersAPI.record({ total: Number(total || 0), items: cart, cashierId: user?._id || null });
    } catch (e) {
      console.error('Failed to record sale/order', e);
    }

    alert(`Paid ₱${Number(amt).toFixed(2)}. Change: ₱${Number(change).toFixed(2)}. Checkout complete.`);
    clearCart();
  };

  return (
    <>
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
              <h3>{selectedCategory}</h3>
              <div className="panel-note">Tap to add — large tiles for quick access</div>
            </div>

            <div>
              <div className="panel-head" style={{ marginTop: 8 }}>
                <h3></h3>
              </div>
              <div className="products-grid">
                {displayedInStock.map(p => {
                  const isOut = false;
                  return (
                    <div
                      key={p._id}
                      className="product-tile"
                      style={{ position: 'relative' }}
                    >
                      <ProductCard product={p} addToCart={addToCart} />
                    </div>
                  );
                })}
              </div>

              <div className="panel-head" style={{ marginTop: 16 }}>
                <h3>Out of stock</h3>
              </div>
              <div className="products-grid">
                {displayedOutOfStock.map(p => {
                  const isOut = true;
                  return (
                    <div
                      key={p._id}
                      className="product-tile"
                      style={{ cursor: 'not-allowed', opacity: 0.6, position: 'relative' }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: '#ef4444',
                          color: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          pointerEvents: 'none'
                        }}
                      >
                        Out of stock
                      </span>
                      <ProductCard product={p} addToCart={() => { }} />
                    </div>
                  );
                })}
              </div>
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
                    <input
                      className="qty"
                      min="0"
                      value={item.qty}
                      onChange={(e) => setQty(item._id, Number(e.target.value))}
                    />
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
    </>
  );
}
