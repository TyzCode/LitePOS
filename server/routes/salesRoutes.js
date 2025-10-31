import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

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


