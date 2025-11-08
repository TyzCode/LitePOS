import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Get sales
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const orders = await db.collection('Sales')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Record a sale
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { amount, items, cashierId } = req.body;

    const sale = {
      amount: Number(amount || 0),
      items: Array.isArray(items) ? items : [],
      cashierId: cashierId || null,
      status: 'successful',
      createdAt: new Date()
    };

    const result = await db.collection('Sales').insertOne(sale);
    res.status(201).json({ ...sale, _id: result.insertedId });
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;


