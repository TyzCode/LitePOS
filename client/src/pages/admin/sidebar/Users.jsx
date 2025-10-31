import React, { useContext, useEffect, useState } from 'react';
import { userAPI } from '../../../services/api.js';
import AuthContext from '../../../context/AuthContext.jsx';
import './Users.css';

export default function Users() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
    const [editingUserId, setEditingUserId] = useState(null);
    const [editPassword, setEditPassword] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await userAPI.getAll();
            setUsers(response.data || []);
            setError('');
        } catch (err) {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await userAPI.create(newUser);
            setNewUser({ username: '', password: '', role: 'user' });
            await loadUsers();
            setError('');
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to create user';
            setError(message);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await userAPI.delete(id);
            await loadUsers();
            setError('');
        } catch (err) {
            setError('Failed to delete user');
        }
    };

    const startEdit = (u) => {
        setEditingUserId(u._id);
        setEditPassword('');
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setEditPassword('');
        setError('');
    };

    const saveEdit = async (id) => {
        try {
            const payload = {};
            if (editPassword && editPassword.trim() !== '') {
                payload.password = editPassword;
            } else {
                setError('Password cannot be empty');
                return;
            }
            await userAPI.update(id, payload);
            await loadUsers();
            cancelEdit();
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to update user';
            setError(message);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="users-page">
            <header className="users-header">
                <div>
                    <h1>Users Management</h1>
                    <div className="users-header__info">Signed in as: {user?.username}</div>
                </div>
            </header>

            <main>
                <section className="user-form">
                    <h2>Add New User</h2>
                    <form onSubmit={handleCreateUser} className="user-form__grid">
                        <input
                            placeholder="Username"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                        <select
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            required
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className="btn btn-primary">Add User</button>
                    </form>
                </section>

                <section className="users-list">
                    <h2>Existing Users</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>{u.username}</td>
                                    <td>{u.role}</td>
                                    <td>
                                        {editingUserId === u._id ? (
                                            <div className="action-buttons">
                                                <input
                                                    type="password"
                                                    placeholder="New password"
                                                    value={editPassword}
                                                    onChange={e => setEditPassword(e.target.value)}
                                                />
                                                <button className="btn btn-primary" onClick={() => saveEdit(u._id)}>Save</button>
                                                <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="action-buttons">
                                                <button className="btn btn-secondary" onClick={() => startEdit(u)}>Edit Password</button>
                                                <button className="btn btn-danger" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {error && <div className="error">{error}</div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    );
}