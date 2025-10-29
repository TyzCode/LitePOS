import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';

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
    <div style={{maxWidth:420, margin:'4rem auto', padding:20, border:'1px solid #eee', borderRadius:8}}>
      <h2 style={{marginBottom:12}}>POS Login</h2>
      <form onSubmit={onSubmit}>
        <label>Username</label>
        <input value={credentials.username} onChange={e=>setCredentials({
            ...credentials,
            username: e.target.value
          })} required style={{width:'100%',marginBottom:8,padding:8}} />
        <label>Password</label>
        <input type="password" value={credentials.password} onChange={e=>setCredentials({
            ...credentials,
            password: e.target.value
          })} required style={{width:'100%',marginBottom:12,padding:8}} />
        {error && <div style={{color:'red', marginBottom:8}}>{error}</div>}
        <button type="submit" style={{padding:'8px 12px'}}>Login</button>
      </form>
    </div>
  );
}
