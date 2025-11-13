import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import './Login.css';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(credentials);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">LitePOS</h2>
      <form onSubmit={onSubmit}>
        <label>Username</label>
        <input
          placeholder="Enter your username"
          className="login-input"
          value={credentials.username}
          onChange={(e) =>
            setCredentials({ ...credentials, username: e.target.value })
          }
          required
        />
        <label>Password</label>
        <input
          placeholder="Enter your password"
          type="password"
          className="login-input"
          value={credentials.password}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
          required
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
}
