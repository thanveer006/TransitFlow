import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import dataRoutes from './routes/dataRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json());

// Define Routes
app.use('/api/data', dataRoutes);

app.get('/', (req, res) => res.send('TransitFlow API Running'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
