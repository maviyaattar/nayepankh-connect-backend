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






/* =========================
   USER SCHEMA
========================= */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    default: ""
  },

  googleId: {
    type: String,
    default: ""
  },

  avatar: {
    type: String,
    default: ""
  },

  role: {
    type: String,
    enum: ["volunteer", "admin"],
    default: "volunteer"
  },

  status: {
    type: String,
    enum: ["active", "banned"],
    default: "active"
  },

  phone: {
    type: String,
    default: ""
  },

  college: {
    type: String,
    default: ""
  },

  skills: {
    type: [String],
    default: []
  },

  interests: {
    type: [String],
    default: []
  },

  city: {
    type: String,
    default: ""
  },

  bio: {
    type: String,
    default: ""
  }

}, {
  timestamps: true
});


const User = mongoose.model("User", userSchema);



/* =========================
   CAMPAIGN SCHEMA
========================= */

const campaignSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: [
      "Education",
      "Environment",
      "Health",
      "Social Awareness",
      "Skill Development",
      "Other"
    ],
    default: "Other"
  },

  image: {
    type: String,
    default: ""
  },

  location: {
    type: String,
    required: true
  },

  eventDate: {
    type: Date,
    required: true
  },

  lastApplyDate: {
    type: Date,
    required: true
  },

  requiredVolunteers: {
    type: Number,
    required: true
  },

  currentVolunteers: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: [
      "upcoming",
      "ongoing",
      "completed",
      "cancelled"
    ],
    default: "upcoming"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

}, {
  timestamps: true
});


const Campaign = mongoose.model(
  "Campaign",
  campaignSchema
);



/* =========================
   APPLICATION SCHEMA
========================= */

const applicationSchema = new mongoose.Schema({

  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    required: true
  },

  message: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "rejected"
    ],
    default: "pending"
  }

}, {
  timestamps: true
});


const Application = mongoose.model(
  "Application",
  applicationSchema
);



/* =========================
   CERTIFICATE SCHEMA
========================= */

const certificateSchema = new mongoose.Schema({

  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    required: true
  },

  certificateUrl: {
    type: String,
    required: true
  },

  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  issuedDate: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});


const Certificate = mongoose.model(
  "Certificate",
  certificateSchema
);



/* =========================
   CONTACT SCHEMA
========================= */

const contactSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  }

}, {
  timestamps: true
});


const Contact = mongoose.model(
  "Contact",
  contactSchema
);


/* =========================
   AUTH MIDDLEWARE
========================= */

const protect = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User
      .findById(decoded.id)
      .select("-password");


    if (!user || user.status === "banned") {

      return res.status(403).json({
        success: false,
        message: "Account not active"
      });

    }


    req.user = user;

    next();

  } catch (error) {

    res.status(401).json({
      success: false,
      message: "Invalid token"
    });

  }

};



const adminOnly = (req, res, next) => {

  if (req.user.role !== "admin") {

    return res.status(403).json({
      success: false,
      message: "Admin access only"
    });

  }

  next();

};


/* =========================
   GOOGLE VOLUNTEER LOGIN
========================= */


app.post("/api/auth/google", async (req, res) => {

  try {

    const { token } = req.body;


    const ticket =
      await googleClient.verifyIdToken({

        idToken: token,

        audience: process.env.GOOGLE_CLIENT_ID

      });


    const payload = ticket.getPayload();


    let user =
      await User.findOne({
        email: payload.email
      });


    if (!user) {

      user = await User.create({

        name: payload.name,

        email: payload.email,

        googleId: payload.sub,

        avatar: payload.picture,

        role: "volunteer"

      });

    }


    const jwtToken =
      generateToken(user._id);


    res.json({

      success: true,

      token: jwtToken,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        avatar: user.avatar

      }

    });


  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: "Google login failed"

    });

  }

});



/* =========================
   ADMIN LOGIN
========================= */


app.post("/api/admin/login", async (req, res) => {

  try {

    const { email, password } = req.body;


    const admin = await User.findOne({
      email,
      role: "admin"
    });


    if (!admin) {

      return res.status(400).json({

        success: false,

        message: "Invalid credentials"

      });

    }


    const match =
      await bcrypt.compare(
        password,
        admin.password
      );


    if (!match) {

      return res.status(400).json({

        success: false,

        message: "Invalid credentials"

      });

    }


    res.json({

      success: true,

      token: generateToken(admin._id),

      user: {

        id: admin._id,

        name: admin.name,

        email: admin.email,

        role: admin.role

      }

    });


  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



/* =========================
   GET CURRENT USER
========================= */


app.get(
  "/api/auth/profile",
  protect,
  async (req, res) => {

    res.json({

      success: true,

      user: req.user

    });

  }

);



/* =========================
   CREATE NEW ADMIN
========================= */


app.post(
  "/api/admin/create",
  protect,
  adminOnly,
  async (req, res) => {


    try {


      const {
        name,
        email,
        password
      } = req.body;


      const exists =
        await User.findOne({
          email
        });


      if (exists) {

        return res.status(400).json({

          success: false,

          message: "Email already exists"

        });

      }


      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );


      const admin =
        await User.create({

          name,

          email,

          password: hashedPassword,

          role: "admin"

        });



      res.status(201).json({

        success: true,

        message:
          "Admin created successfully",

        admin: {

          id: admin._id,

          name: admin.name,

          email: admin.email

        }

      });


    } catch (error) {


      res.status(500).json({

        success: false,

        message: error.message

      });


    }


  }

);



/* =========================
   UPLOAD CAMPAIGN IMAGE
========================= */

app.post(
  "/api/upload",
  protect,
  adminOnly,
  upload.single("image"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image selected"
        });
      }


      const base64 =
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;


      const result =
        await cloudinary.uploader.upload(
          base64,
          {
            folder: "nayepankh-campaigns"
          }
        );


      res.json({
        success: true,
        imageUrl: result.secure_url
      });


    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }

  }
);


/* =========================
   CREATE CAMPAIGN
========================= */

app.post(
  "/api/campaigns",
  protect,
  adminOnly,
  async (req, res) => {

    try {


      const campaign =
        await Campaign.create({

          title: req.body.title,

          description: req.body.description,

          category: req.body.category,

          image: req.body.image,

          location: req.body.location,

          eventDate: req.body.eventDate,

          lastApplyDate: req.body.lastApplyDate,

          requiredVolunteers:
            req.body.requiredVolunteers,

          createdBy: req.user._id

        });


      res.status(201).json({

        success: true,

        campaign

      });


    } catch (error) {


      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);



/* =========================
   GET ALL CAMPAIGNS
========================= */

app.get(
  "/api/campaigns",
  async (req, res) => {


    try {


      const campaigns =
        await Campaign.find({

          status: {
            $ne: "cancelled"
          }

        })
        .populate(
          "createdBy",
          "name email"
        )
        .sort({
          createdAt: -1
        });


      res.json({

        success: true,

        count: campaigns.length,

        campaigns

      });


    } catch (error) {


      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);



/* =========================
   GET SINGLE CAMPAIGN
========================= */

app.get(
  "/api/campaigns/:id",
  async (req, res) => {


    try {


      const campaign =
        await Campaign.findById(
          req.params.id
        )
        .populate(
          "createdBy",
          "name email"
        );


      if (!campaign) {

        return res.status(404).json({

          success: false,

          message: "Campaign not found"

        });

      }


      res.json({

        success: true,

        campaign

      });


    } catch (error) {


      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);



/* =========================
   UPDATE CAMPAIGN
========================= */

app.put(
  "/api/campaigns/:id",
  protect,
  adminOnly,
  async (req, res) => {


    try {


      const campaign =
        await Campaign.findByIdAndUpdate(

          req.params.id,

          req.body,

          {
            new: true
          }

        );


      if (!campaign) {


        return res.status(404).json({

          success: false,

          message: "Campaign not found"

        });

      }


      res.json({

        success: true,

        campaign

      });


    } catch (error) {


      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);



/* =========================
   DELETE CAMPAIGN
========================= */

app.delete(
  "/api/campaigns/:id",
  protect,
  adminOnly,
  async (req, res) => {


    try {


      const campaign =
        await Campaign.findByIdAndDelete(
          req.params.id
        );


      if (!campaign) {


        return res.status(404).json({

          success: false,

          message: "Campaign not found"

        });

      }


      res.json({

        success: true,

        message:
          "Campaign deleted successfully"

      });


    } catch (error) {


      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);


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