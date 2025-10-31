import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Temporary admin
    if (username === 'admin' && password === 'admin123') {
      const token = 'mock-token';
      return res.json({ token, user: { _id: 'temp-admin', username: 'admin', role: 'admin' } });
    }

    const user = await db.collection('Users').findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = 'mock-token';

    const { password: _pw, ...safeUser } = user;
    return res.json({ token, user: { ...safeUser } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;


