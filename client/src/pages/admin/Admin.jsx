import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/AuthContext.jsx';
import { productAPI, userAPI } from '../../services/api.js';
import './Admin.css';

export default function Admin() {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    image: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadProducts();
    loadUsers();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    } else {
      setError('Please upload a valid image file');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userAPI.create(newUser);
      setNewUser({ username: '', password: '', role: 'user' });
      loadUsers();
      setError('');
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userAPI.delete(id);
      loadUsers();
      setError('');
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const loadProducts = async () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productAPI.create(formData);
      setFormData({ name: '', description: '', price: '', quantity: '', category: '' });
      setPreview(null);
      loadProducts();
      setError('');
    } catch (err) {
      setError('Failed to create product');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await productAPI.update(id, data);
      loadProducts();
      setError('');
    } catch (err) {
      setError('Failed to update product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productAPI.delete(id);
      loadProducts();
      setError('');
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <header>
        <div>
          <h1>Admin Dashboard</h1>
          <div className="user-info">Signed in as: {user?.username}</div>
        </div>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      <main>
        {/* User */}
        {/* <section className="user-management">
          <h2>User Management</h2>
          {error && <div className="error">{error}</div>}

          <form onSubmit={handleCreateUser}>
            <div>
              <input
                placeholder="Username"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
            </div>
            <div>
              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit">Add User</button>
          </form>

          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section> */}

        {/* Product */}
        <section className="product-form">
          <h2>Add New Product</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-left">
              <input
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                placeholder="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Price (₱)"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <input
                placeholder="Category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <button type="submit" className='submit-btn'>Add Product</button>
            </div>

            <div className="form-right">
              <div className="image-preview">
                {preview ? (
                  <img src={preview} alt="Preview" />
                ) : (
                  <span>No Image Selected</span>
                )}
              </div>
              <label className="upload-btn">
                Add Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </label>
            </div>
          </form>
        </section>

        <section className="products-list">
          <h2>Products Inventory</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>₱{product.price}</td>
                  <td>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={e => handleUpdate(product._id, { quantity: e.target.value })}
                    />
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <button onClick={() => handleDelete(product._id)}>Delete</button>
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