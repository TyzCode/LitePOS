import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const users = await db.collection('Users')
      .find({}) //, { projection: { password: 0 } }
      .toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { username, password, role } = req.body;

    // Check if username already exists
    const existingUser = await db.collection('Users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      password: hashedPassword,
      role: role || 'user',
      createdAt: new Date()
    };

    const result = await db.collection('Users').insertOne(newUser);
    
    // Remove password from response
    delete newUser.password;
    res.status(201).json({ ...newUser, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update user password
router.put('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    const { password } = req.body;

    if (!password || String(password).trim() === '') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('Users').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { password: hashedPassword } },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.value);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;

    const result = await db.collection('Users').deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', id });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;