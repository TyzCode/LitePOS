import { useEffect, useState } from 'react';
import { productAPI } from '../../../services/api.js';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalItems: 0, totalSales: 0, completedOrders: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
            try {
                const response = await productAPI.getCount();
                setStats(response.data);
                setLoading(false);
                setError('');
            } catch (err) {
                setError('Failed to load products');
                setLoading(false);
            }
        };

    const loadInventory = async () => {
        try {
            const response = await productAPI.getAll();
            setProducts(response.data);
            setLoading(false);
            setError('');
        } catch (err) {
            setError('Failed to load products');
            setLoading(false);
        }
    };
    loadInventory();
    loadProducts();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Sales</h3>
          <p>₱{Number(stats.totalSales || 0).toFixed(2)}</p>
        </div>
        <div className="dashboard-card">
          <h3>Total Items</h3>
          <p>{stats.totalItems}</p>
        </div>
        <div className="dashboard-card">
          <h3>Completed Orders</h3>
          <p>{stats.completedOrders}</p>
        </div>
      </div>

      <div className="inventory-preview">
        <h2>Inventory Snapshot</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
