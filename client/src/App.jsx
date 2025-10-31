import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login.jsx';
import Dashboard from './pages/cashier/Dashboard.jsx';
import Admin from './pages/admin/Admin.jsx';
import Inventory from './pages/admin/sidebar/Inventory.jsx';
import Users from './pages/admin/sidebar/Users.jsx';
import Analysis from './pages/admin/sidebar/Analysis.jsx';
import AdminDashboard from './pages/admin/sidebar/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App(){
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard/></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}><Admin/></ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="analysis" element={<Analysis />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}