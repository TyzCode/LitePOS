import express from 'express';
import mongoose from 'mongoose';
import { Int32 } from 'mongodb';

const router = express.Router();

// Get all products from Inventory collection
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const inventory = await db.collection('Inventory').find({}).toArray();
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new product to Inventory
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const payload = { ...req.body };
    if (payload.quantity !== undefined) {
      const q = parseInt(payload.quantity, 10);
      payload.quantity = new Int32(Number.isNaN(q) ? 0 : q);
    }
    const newProduct = {
      ...payload,
      createdAt: new Date()
    };

    const result = await db.collection('Inventory').insertOne(newProduct);
    res.status(201).json({ ...newProduct, _id: result.insertedId });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update product in Inventory
router.put('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const id = req.params.id;

    const isValid = mongoose.Types.ObjectId.isValid(id);
    const filter = isValid
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const updatePayload = { ...req.body };
    if (updatePayload.quantity !== undefined) {
      const q = parseInt(updatePayload.quantity, 10);
      updatePayload.quantity = new Int32(Number.isNaN(q) ? 0 : q);
    }
    const upd = await db.collection('Inventory').updateOne(filter, { $set: updatePayload });
    if (!upd.matchedCount) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const doc = await db.collection('Inventory').findOne(filter);
    res.json(doc);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete product from Inventory
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;

    const result = await db.collection('Inventory').deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', id });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const totalItems = await db.collection('Inventory').countDocuments();

    const salesAgg = await db.collection('Sales').aggregate([
      { $match: { status: 'successful' } },
      { $group: { _id: null, sum: { $sum: { $toDouble: '$amount' } }, count: { $sum: 1 } } }
    ]).toArray();
    const totalSales = salesAgg.length > 0 ? salesAgg[0].sum : 0;

    const completedOrders = await db.collection('Orders').countDocuments({ status: 'completed' });

    res.json({ totalItems, totalSales, completedOrders });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;