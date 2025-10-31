import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Record a completed order
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { items, total, cashierId } = req.body;

    const order = {
      items: Array.isArray(items) ? items : [],
      total: Number(total || 0),
      cashierId: cashierId || null,
      status: 'completed',
      createdAt: new Date()
    };

    const result = await db.collection('Orders').insertOne(order);
    res.status(201).json({ ...order, _id: result.insertedId });
  } catch (error) {
    console.error('Error recording order:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;


