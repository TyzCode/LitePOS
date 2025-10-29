import express from 'express';
import mongoose from 'mongoose';

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
    const newProduct = {
      ...req.body,
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

    const result = await db.collection('Inventory').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.value);
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

export default router;