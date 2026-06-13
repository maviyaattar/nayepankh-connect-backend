/**
 * NayePankh Connect Backend API
 * Tech:
 * Node.js + Express + MongoDB
 * Google OAuth + JWT
 * Cloudinary + Groq AI
 */

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const { OAuth2Client } = require("google-auth-library");


// =========================
// APP CONFIG
// =========================

const app = express();

const PORT = process.env.PORT || 5000;


// =========================
// MIDDLEWARE
// =========================

app.use(
  cors({
    origin: "https://nayepankh-inky.vercel.app",
    credentials: true
  })
);

app.use(express.json());

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);


// =========================
// MONGODB CONNECTION
// =========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
  });


// =========================
// CLOUDINARY CONFIG
// =========================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,

  api_secret: process.env.CLOUDINARY_API_SECRET
});


// =========================
// GOOGLE OAUTH
// =========================

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);


// =========================
// GROQ AI CONFIG
// =========================

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const AI_MODEL = "llama-3.1-8b-instant";


// =========================
// MULTER CONFIG
// =========================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


// =========================
// JWT TOKEN GENERATOR
// =========================

function generateToken(id) {

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d"
    }
  );

}


// =========================
// HOME / HEALTH CHECK
// =========================

app.get("/", (req, res) => {

  res.json({

    success: true,

    project: "NayePankh Connect",

    message: "🚀 Backend Running Successfully"

  });

});


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

  console.log(
    `🚀 Server running on port ${PORT}`
  );

});