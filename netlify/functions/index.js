const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("../../routes/route");
const serverless = require('serverless-http');
const { config } = require('dotenv');

config();

const dbURI = process.env.dbURI;
const app = express();
const Path = '/.netlify/functions/index';

// Middleware
app.use(cors({
  origin: "*",
}));
app.use(express.json());
app.use(Path, routes);

// Database connection promise
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    console.log('Establishing new database connection');
    await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    cachedDb = mongoose.connection;
    console.log('MongoDB connected successfully');
    return cachedDb;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Main handler with proper async/await
const handler = async (event, context) => {
  // Prevent Lambda from waiting for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Ensure database is connected before handling request
    await connectToDatabase();

    // Handle the request through serverless-http
    const serverlessHandler = serverless(app);
    return await serverlessHandler(event, context);
    
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};

module.exports.handler = handler;
