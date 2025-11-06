import React, { useContext, useEffect, useState } from 'react';
import AuthContext from '../../../context/AuthContext.jsx';
import { productAPI, ordersAPI } from '../../../services/api.js';
import './Analysis.css';

const SimpleLineChart = ({ points = [], width = 400, height = 140, stroke = '#10b981' }) => {
    if (!points || points.length === 0) return <div className="chart-empty">No data</div>;
    const max = Math.max(...points.map(p => p.value || p));
    const min = Math.min(...points.map(p => p.value || p));
    const pad = 10;
    const w = width;
    const h = height;
    const stepX = w / Math.max(1, points.length - 1);
    const toY = (v) => h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2);

    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(p.value || p)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="line-chart">
            <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
                <circle key={i} cx={i * stepX} cy={toY(p.value || p)} r={3} fill={stroke} />
            ))}
        </svg>
    );
};

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
    const [activePeriod, setActivePeriod] = useState('week');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [countRes, prodRes] = await Promise.allSettled([
                productAPI.getCount(),
                productAPI.getAll()
            ]);

            if (countRes.status === 'fulfilled') {
                setStats(countRes.value.data || null);
            }
            if (prodRes.status === 'fulfilled') {
                setProducts(prodRes.value.data || []);
                if (!countRes.value) {
                    const computed = computeTopSelling(prodRes.value.data || []);
                    setStats(prev => ({
                        totalItems: (prodRes.value.data || []).length,
                        totalSales: computed.totalSales,
                        completedOrders: computed.completedOrders,
                        topSelling: computed.topSelling,
                        salesByMonth: computed.salesByMonth
                    }));
                }
            }
            setError('');
        } catch (err) {
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const computeTopSelling = (list) => {
        const map = {};
        let totalSales = 0;
        (list || []).forEach(p => {
            const sold = Number(p.sold || p.sales || 0);
            if (!map[p.name]) map[p.name] = { name: p.name, value: 0 };
            map[p.name].value += sold;
            totalSales += sold;
        });
        const arr = Object.values(map).sort((a, b) => b.value - a.value).slice(0, 8);
        return { topSelling: arr, totalSales, completedOrders: 0, salesByMonth: [] };
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

    const salesByMonth = (stats && stats.salesByMonth) || [];
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
                            <td>{item.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const getTopSales = (period) => {
        if (!products || products.length === 0) return [];
        const now = new Date();
        let start;
        if (period === 'week') {
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0,0,0,0);
        } else if (period === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
        }
        const ranks = products.map(p => {
            let value = 0;
            if (Array.isArray(p.salesHistory)) {
                value = p.salesHistory.filter(s => new Date(s.date) >= start).reduce((sum, s) => sum + Number(s.qty || 0), 0);
            } else if (p.sold || p.sales) {
                value = Number(p.sold || p.sales || 0);
            }
            return { name: p.name, value };
        });
        return ranks.sort((a, b) => b.value - a.value).slice(0, 8);
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
                        <h3>Total Items</h3>
                        <p className="large">{(stats && stats.totalItems) ?? products.length}</p>
                    </div>
                    <div className="card">
                        <h3>Sales Made</h3>
                        <p className="large">₱{Number(stats && stats.totalSales).toFixed(2) ?? 0}</p>
                    </div>
                    <div className="card clickable" onClick={toggleShowOrders} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key === 'Enter' || e.key === ' ') toggleShowOrders(); }}>
                        <h3>Completed Orders</h3>
                        <p className="large">{(stats && stats.completedOrders) ?? 0}</p>
                        <div className="card-hint">Click to view</div>
                    </div>
                </section>

                <section className="analytics-charts">
                    <div className="chart-panel">
                        <h2>Top Selling Products</h2>
                        <div className="period-toggle">
                            <button
                                className={activePeriod === 'week' ? 'active' : ''}
                                onClick={() => setActivePeriod('week')}
                            >Week</button>
                            <button
                                className={activePeriod === 'month' ? 'active' : ''}
                                onClick={() => setActivePeriod('month')}
                            >Month</button>
                            <button
                                className={activePeriod === 'year' ? 'active' : ''}
                                onClick={() => setActivePeriod('year')}
                            >Year</button>
                        </div>
                        <div className="ranked-sales">
                            {SalesRankTable(getTopSales(activePeriod))}
                        </div>
                    </div>

                    <div className="chart-panel">
                        <h2>Sales Over Time</h2>
                        <SimpleLineChart points={(salesByMonth.length ? salesByMonth : []).map(s => ({ label: s.month || s.label, value: Number(s.total || s.value || 0) }))} width={520} height={180} />
                        <div className="month-legend">
                            {(salesByMonth.length ? salesByMonth : []).map((s, i) => (
                                <div key={i} className="legend-item">{s.month || s.label}</div>
                            ))}
                        </div>
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
                                                    <div key={i}>{it.name || it.productName || `Item ${i+1}`} x{it.qty}</div>
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