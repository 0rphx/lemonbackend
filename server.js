const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./routes/route");
const { config } = require('dotenv');

config();

const dbURI = process.env.dbURI;
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors({
  origin: "*",
}));
app.use(express.json());

// Routes (without the Netlify path prefix)
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Database connection
const connectToDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if database connection fails
  }
};

// Start server
const startServer = async () => {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
