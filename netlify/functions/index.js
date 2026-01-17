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

// middleware
app.use(cors());
app.use(cors({
  origin: "*",
}));
app.use(express.json());
app.use(Path, routes);


// database connection
mongoose.connect(dbURI)
.then(() => {
    console.log('mongo connected')})
.catch((err) => console.log(err))


module.exports.handler = serverless(app);