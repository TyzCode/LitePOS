import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Get orders
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const orders = await db.collection('Orders')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

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


