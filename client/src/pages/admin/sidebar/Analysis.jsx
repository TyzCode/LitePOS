import React, { useContext, useEffect, useState } from 'react';
import AuthContext from '../../../context/AuthContext.jsx';
import { productAPI, ordersAPI, salesAPI } from '../../../services/api.js';
import './Analysis.css';
import SalesChart from '../../../components/SalesChart.jsx';
import RevenueGrowth from '../../../components/RevenueGrowth.jsx';
import PredictionList from '../../../components/PredictionList.jsx';

const Analysis = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [showOrders, setShowOrders] = useState(false);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');
    const [salesData, setSalesData] = useState([]);
    const [range, setRange] = useState("7d");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [countRes, prodRes, salesRes] = await Promise.allSettled([
                productAPI.getCount(),
                productAPI.getAll(),
                salesAPI.getAll()
            ]);

            if (countRes.status === 'fulfilled') {
                setStats(countRes.value.data || null);
            }
            if (prodRes.status === 'fulfilled') {
                setProducts(prodRes.value.data || []);
            }
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

    const fetchCompletedOrders = async () => {
        setOrdersLoading(true);
        setOrdersError('');
        try {
            const res = await ordersAPI.getCompleted();
            setOrders(res.data || []);
        } catch (err) {
            try {
                const res2 = await ordersAPI.getAll({ status: 'completed' });
                setOrders(res2.data || []);
            } catch (err2) {
                setOrdersError('Failed to load completed orders');
            }
        } finally {
            setOrdersLoading(false);
        }
    };

    const toggleShowOrders = async () => {
        const opening = !showOrders;
        setShowOrders(opening);
        if (opening && orders.length === 0) {
            await fetchCompletedOrders();
        }
    };

    if (loading) return <div className="analytics">Loading...</div>;

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
        <div className="analytics-page">
            <header className="analytics-header">
                <div>
                    <h1>Analytics & Insights</h1>
                    <div className="analytics-header__info">Signed in as: {user?.username}</div>
                </div>
            </header>

            <main>
                <section className="analytics-cards">
                    <div className="card">
                        <h2>Sales Made</h2>
                        <SalesChart range={range} setRange={setRange} />
                    </div>
                    <div className="card">
                        <RevenueGrowth range={range}/>
                    </div>
                    <table className='chart-panel'>
                        <thead>
                            <h2>🏆 Top Selling Products</h2>
                        </thead>
                        <tbody>
                            <div className="ranked-sales">
                                {SalesRankTable(getTopSales())}
                            </div>
                        </tbody>
                    </table>
                </section>

                <section className="analytics-charts">
                    <div className="card clickable" onClick={toggleShowOrders} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleShowOrders(); }}>
                        <h3>Completed Orders</h3>
                        <p className="large">{(stats && stats.completedOrders) ?? 0}</p>
                        <div className="card-hint">Click to view</div>
                    </div>
                    <div className="card">
                        <PredictionList />
                    </div>
                </section>

            </main>

            {/* Show orders when clicked */}
            {showOrders && (
                <section className="completed-orders">
                    <div className="chart-panel">
                        <h2>Completed Orders</h2>
                        {ordersLoading ? (
                            <div>Loading orders...</div>
                        ) : ordersError ? (
                            <div className="error">{ordersError}</div>
                        ) : orders.length === 0 ? (
                            <div>No completed orders found.</div>
                        ) : (
                            <table className="top-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Cashier</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o._id}>
                                            <td>{String(o._id)}</td>
                                            <td>
                                                {(o.items || []).map((it, i) => (
                                                    <div key={i}>{it.name || it.productName || `Item ${i + 1}`} x{it.qty}</div>
                                                ))}
                                            </td>
                                            <td>₱{Number(o.total || 0).toFixed(2)}</td>
                                            <td>{o.cashierId || o.cashier || '-'}</td>
                                            <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Analysis;