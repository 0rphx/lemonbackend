const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./routes/route");
const { config } = require('dotenv');
config();

// Read environment variable with fallback and logging
const dbURI = process.env.MONGO_URI || process.env.dbURI;
const PORT = process.env.PORT || 5000;

// Log what we're using
console.log('Environment variables:');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('dbURI:', process.env.dbURI);
console.log('Using connection string:', dbURI);

if (!dbURI) {
  console.error('ERROR: No MongoDB connection string found in environment variables!');
  console.error('Please set MONGO_URI or dbURI environment variable.');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: "*",
}));
app.use(express.json());

// Root endpoint - shows available routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lemon Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: {
        path: '/health',
        method: 'GET',
        description: 'Check API and database status'
      },
      getRisk: {
        path: '/api/getrisk',
        method: 'GET',
        description: 'Get risk objects'
      },
      updateRisk: {
        path: '/api/updaterisk',
        method: 'POST',
        description: 'Update risk objects',
        contentType: 'application/json'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Routes
app.use('/api', routes);

// Database connection with retry logic
const connectToDatabase = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Connecting to MongoDB... (attempt ${i + 1}/${retries})`);
      console.log(`Connection string: ${dbURI}`);
      
      await mongoose.connect(dbURI, {
        serverSelectionTimeoutMS: 5000,
      });
      
      console.log('✅ MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection error (attempt ${i + 1}/${retries}):`, err.message);
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('🔴 Failed to connect to MongoDB after all retries');
        console.error('Full error:', err);
        process.exit(1);
      }
    }
  }
};

// Start server
const startServer = async () => {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API endpoints available at http://localhost:${PORT}/`);
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
