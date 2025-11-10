import { useEffect, useState } from 'react';
import { productAPI, salesAPI } from '../../../services/api.js';
import './AdminDashboard.css';
import SalesChart from '../../../components/SalesChart.jsx';
import PredictionList from '../../../components/PredictionList.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalItems: 0, totalSales: 0, completedOrders: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [range, setRange] = useState("7d");
  const [salesData, setSalesData] = useState([]);

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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes] = await Promise.allSettled([
        salesAPI.getAll()
      ]);
      if (salesRes.status === 'fulfilled') {
        setSalesData(salesRes.value.data || []);
      }
      setError('');
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const SalesRankTable = (data) => {
    if (!data || data.length === 0) return <div>No data available</div>;
    return (
      <table className="top-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Product</th>
            <th>Units Sold</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.name || i}>
              <td>{i + 1}</td>
              <td>{item.name}</td>
              <td>{item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const getTopSales = () => {
    if (!salesData || salesData.length === 0 || !products) return [];

    const totals = {};
    (salesData || []).forEach(sale => {
      const statusOk = !sale.status || sale.status === 'successful' || sale.status === 'completed';
      if (!statusOk) return;

      (sale.items || []).forEach(item => {
        const name = item.name;
        const qty = Number(item.qty) || 0;
        if (!totals[name]) totals[name] = { name, qty: 0 };
        totals[name].qty += qty;
      });
    });

    return Object.values(totals).sort((a, b) => b.qty - a.qty).slice(0, 8);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Sales</h3>
          <SalesChart range={range} setRange={setRange} />
        </div>
        <div className="dashboard-card">
          <PredictionList />
        </div>
        <div className="dashboard-card">
          <h3>🏆 Top Selling Products</h3>
          <div>
            {SalesRankTable(getTopSales())}
          </div>
        </div>
      </div>

      <div className="inventory-preview">
        <h2>Inventory Snapshot</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>
                  {Number(item.quantity || 0) <= 0 ? (
                    <span className="status-out">Out of stock</span>
                  ) : <span className="status-in">In Stock</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
