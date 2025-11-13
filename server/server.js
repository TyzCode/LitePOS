  import express from 'express';
  import mongoose from 'mongoose';
  import cors from 'cors';
  import dotenv from 'dotenv';
  import productRoutes from './routes/productRoutes.js';
  import salesRoutes from './routes/salesRoutes.js';
  import ordersRoutes from './routes/ordersRoutes.js';
  import userRoutes from './routes/userRoutes.js';
  import authRoutes from './routes/authRoutes.js';
  import predictionRoutes from './routes/predictionRoutes.js';

  dotenv.config();

  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));

  app.use(express.json());

  // Routes
  app.use('/api/Inventory', productRoutes);
  app.use('/api/Sales', salesRoutes);
  app.use('/api/Orders', ordersRoutes);
  app.use('/api/Users', userRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', predictionRoutes);

  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to existing MongoDB database'))
    .catch(err => console.error('Connection error: ', err));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });