import React, { useContext, useState, useEffect } from 'react';
import { productAPI } from '../../../services/api.js';
import AuthContext from '../../../context/AuthContext.jsx';
import '../sidebar/Inventory.css';

export default function AdminDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingProductId, setEditingProductId] = useState(null);
    const [editProduct, setEditProduct] = useState({ name: '', description: '', price: '', quantity: '', category: '' });
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [preview, setPreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category: '',
        image: null
    });

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

    const categories = Array.from(new Set((products || []).map(p => p.category).filter(Boolean))).sort();

    const handleUpdate = async (id, data) => {
        try {
            await productAPI.update(id, data);
            loadProducts();
            setError('');
        } catch (err) {
            setError('Failed to update product');
        }
    };

    const startEdit = (p) => {
        setEditingProductId(p._id);
        setEditProduct({
            name: p.name || '',
            description: p.description || '',
            price: p.price || '',
            quantity: p.quantity || '',
            category: p.category || ''
        });
        setIsNewCategory(false);
        setNewCategory('');
    };

    const cancelEdit = () => {
        setEditingProductId(null);
        setEditProduct({ name: '', description: '', price: '', quantity: '', category: '' });
        setError('');
        setIsNewCategory(false);
        setNewCategory('');
    };

    const saveEdit = async (id) => {
        try {
            await productAPI.update(id, {
                name: editProduct.name,
                description: editProduct.description,
                price: editProduct.price,
                quantity: editProduct.quantity,
                category: editProduct.category
            });
            await loadProducts();
            cancelEdit();
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
        <>
            <div className="admin-dashboard">
                <header>
                    <div>
                        <h1>Inventory Management</h1>
                        <div className="user-info">Signed in as: {user?.username}</div>
                    </div>
                </header>

                <main>
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
                                    <th>Status</th>
                                    <th>Category</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product._id}>
                                        <td>
                                            {editingProductId === product._id ? (
                                                <input
                                                    value={editProduct.name}
                                                    onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                product.name
                                            )}
                                        </td>
                                        <td>
                                            {editingProductId === product._id ? (
                                                <input
                                                    value={editProduct.description}
                                                    onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                product.description
                                            )}
                                        </td>
                                        <td>
                                            {editingProductId === product._id ? (
                                                <input
                                                    type="number"
                                                    value={editProduct.price}
                                                    onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                `₱${product.price}`
                                            )}
                                        </td>
                                        <td>
                                            {editingProductId === product._id ? (
                                                <input
                                                    type="number"
                                                    value={editProduct.quantity}
                                                    onChange={e => setEditProduct({ ...editProduct, quantity: e.target.value })}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                product.quantity
                                            )}
                                        </td>
                                        <td>
                                            {Number(product.quantity || 0) <= 0 ? (
                                                <span className="status-out">Out of stock</span>
                                            ) : ''}
                                        </td>
                                        <td>
                                            {editingProductId === product._id ? (
                                                <div>
                                                    <select
                                                        value={isNewCategory ? '__new__' : (categories.includes(editProduct.category) ? editProduct.category : '')}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (val === '__new__') {
                                                                setIsNewCategory(true);
                                                                setNewCategory('');
                                                                setEditProduct({ ...editProduct, category: '' });
                                                            } else {
                                                                setIsNewCategory(false);
                                                                setNewCategory('');
                                                                setEditProduct({ ...editProduct, category: val });
                                                            }
                                                        }}
                                                        className="edit-input"
                                                    >
                                                        <option value="" disabled>Select category</option>
                                                        {categories.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                        <option value="__new__">Create new category…</option>
                                                    </select>
                                                    {isNewCategory && (
                                                        <input
                                                            placeholder="New category name"
                                                            value={newCategory}
                                                            onChange={e => {
                                                                setNewCategory(e.target.value);
                                                                setEditProduct({ ...editProduct, category: e.target.value });
                                                            }}
                                                            className="edit-input edit-input--spaced"
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                product.category
                                            )}
                                        </td>
                                        <td>
                                            {editingProductId === product._id ? (
                                                <div className="action-buttons">
                                                    <button className="btn btn-primary" onClick={() => saveEdit(product._id)}>Save</button>
                                                    <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="action-buttons">
                                                    <button className="btn btn-secondary" onClick={() => startEdit(product)}>Edit</button>
                                                    <button className="btn btn-danger" onClick={() => handleDelete(product._id)}>Delete</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </main>
            </div>
        </>
    );
}