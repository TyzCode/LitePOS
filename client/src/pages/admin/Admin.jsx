import { Link, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext.jsx';
import './Admin.css';

const Admin = () => {
    const { user, logout } = useContext(AuthContext);
    return (
        <div className="admin-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/admin" className="nav-link">Dashboard</Link>
                    <Link to="/admin/users" className="nav-link">Users</Link>
                    <Link to="/admin/inventory" className="nav-link">Inventory</Link>
                    <Link to="/admin/analysis" className="nav-link">Analysis</Link>
                </nav>
                <nav className="sidebar-nav-logout">
                    <button onClick={logout} className="logout-btn">Logout</button>
                </nav>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Admin;
