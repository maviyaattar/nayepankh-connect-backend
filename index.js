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
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const streamifier = require("streamifier");
const crypto = require("crypto");

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
},

badges: {
  type: [String],
  default: []
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

  certificateId: {
    type: String,
    unique: true,
    required: true
  },


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


  pdfUrl: {
    type: String,
    required: true
  },


  qrCode: {
    type: String,
    default: ""
  },


  status: {

    type: String,

    enum: [
      "active",
      "revoked"
    ],

    default: "active"

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


const Certificate =
mongoose.model(
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
   NOTIFICATION SCHEMA
========================= */

const notificationSchema = new mongoose.Schema({

  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title:{
    type:String,
    required:true
  },

  message:{
    type:String,
    required:true
  },

  isRead:{
    type:Boolean,
    default:false
  }

},{
  timestamps:true
});


const Notification = mongoose.model(
  "Notification",
  notificationSchema
);



/* =========================
   ACTIVITY LOG SCHEMA
========================= */

const activitySchema = new mongoose.Schema({

  adminId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  action:{
    type:String,
    required:true
  },

  details:{
    type:String,
    default:""
  }

},{
  timestamps:true
});


const Activity = mongoose.model(
  "Activity",
  activitySchema
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


/* =========================
   APPLY FOR CAMPAIGN
========================= */

app.post(
  "/api/applications/:campaignId",
  protect,
  async (req, res) => {

    try {

      // Only volunteers can apply
      if (req.user.role !== "volunteer") {
        return res.status(403).json({
          success: false,
          message: "Only volunteers can apply"
        });
      }


      const campaign = await Campaign.findById(
        req.params.campaignId
      );


      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found"
        });
      }


      // Check deadline
      if (new Date() > campaign.lastApplyDate) {

        return res.status(400).json({
          success: false,
          message: "Application deadline ended"
        });

      }


      // Check seats
      if (
        campaign.currentVolunteers >=
        campaign.requiredVolunteers
      ) {

        return res.status(400).json({
          success: false,
          message: "No seats available"
        });

      }


      // Duplicate check
      const alreadyApplied =
        await Application.findOne({
          volunteerId: req.user._id,
          campaignId: campaign._id
        });


      if (alreadyApplied) {

        return res.status(400).json({
          success: false,
          message: "You already applied"
        });

      }


      const application =
        await Application.create({

          volunteerId: req.user._id,

          campaignId: campaign._id,

          message: req.body.message || ""

        });


      res.status(201).json({

        success: true,

        message: "Application submitted",

        application

      });


    } catch(error) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }

  }
);



/* =========================
   MY APPLICATIONS
========================= */


app.get(
  "/api/my-applications",
  protect,
  async(req,res)=>{


    try{


      const applications =
      await Application.find({

        volunteerId:req.user._id

      })
      .populate(
        "campaignId",
        "title image location eventDate status"
      )
      .sort({
        createdAt:-1
      });


      res.json({

        success:true,

        count:applications.length,

        applications

      });


    }catch(error){

      res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);



/* =========================
   CANCEL APPLICATION
========================= */


app.delete(
  "/api/applications/:id",
  protect,
  async(req,res)=>{


    try{


      const application =
      await Application.findById(
        req.params.id
      );


      if(!application){

        return res.status(404).json({
          success:false,
          message:"Application not found"
        });

      }


      if(
        application.volunteerId.toString()
        !==
        req.user._id.toString()
      ){

        return res.status(403).json({
          success:false,
          message:"Unauthorized"
        });

      }


     // Approving for first time
if(
  application.status !== "approved" &&
  status === "approved"
){

  campaign.currentVolunteers++;

  await campaign.save();

}


// Changing approved to rejected
if(
  application.status === "approved" &&
  status === "rejected"
){

  campaign.currentVolunteers--;

  await campaign.save();

}

      await application.deleteOne();


      res.json({

        success:true,

        message:"Application cancelled"

      });


    }catch(error){

      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);



/* =========================
   ADMIN GET ALL APPLICATIONS
========================= */


app.get(
  "/api/admin/applications",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const applications =
      await Application.find()

      .populate(
        "volunteerId",
        "name email phone college"
      )

      .populate(
        "campaignId",
        "title category location"
      )

      .sort({
        createdAt:-1
      });



      res.json({

        success:true,

        count:applications.length,

        applications

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);



/* =========================
   APPROVE / REJECT APPLICATION
========================= */


app.put(
  "/api/admin/applications/:id",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const { status } = req.body;


      if(
        !["approved","rejected"]
        .includes(status)
      ){

        return res.status(400).json({

          success:false,

          message:"Invalid status"

        });

      }


      const application =
      await Application.findById(
        req.params.id
      );


      if(!application){

        return res.status(404).json({

          success:false,

          message:"Application not found"

        });

      }


      const campaign =
      await Campaign.findById(
        application.campaignId
      );


      if(
        status === "approved"
        &&
        campaign.currentVolunteers >=
        campaign.requiredVolunteers
      ){

        return res.status(400).json({

          success:false,

          message:"Campaign is full"

        });

      }


      // Increase count only first time approval
      if(
        application.status !== "approved"
        &&
        status === "approved"
      ){

        campaign.currentVolunteers++;

        await campaign.save();

      }


      application.status = status;

      await application.save();


      res.json({

        success:true,

        message:
        `Application ${status}`,

        application

      });


    }catch(error){

      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);


/* =========================
   UPDATE VOLUNTEER PROFILE
========================= */

app.put(
  "/api/profile",
  protect,
  async (req,res)=>{

    try{

      const updatedUser =
      await User.findByIdAndUpdate(

        req.user._id,

        {
          name:req.body.name,
          phone:req.body.phone,
          college:req.body.college,
          city:req.body.city,
          bio:req.body.bio,
          skills:req.body.skills,
          interests:req.body.interests
        },

        {
          new:true
        }

      ).select("-password");


      res.json({
        success:true,
        user:updatedUser
      });


    }catch(error){

      res.status(500).json({
        success:false,
        message:error.message
      });

    }

  }
);



/* =========================
   UPLOAD PROFILE AVATAR
========================= */

app.post(
  "/api/profile/avatar",
  protect,
  upload.single("image"),
  async(req,res)=>{

    try{

      if(!req.file){

        return res.status(400).json({
          success:false,
          message:"No image selected"
        });

      }


      const base64 =
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;


      const result =
      await cloudinary.uploader.upload(
        base64,
        {
          folder:"nayepankh-users"
        }
      );


      const user =
      await User.findByIdAndUpdate(

        req.user._id,

        {
          avatar:result.secure_url
        },

        {
          new:true
        }

      ).select("-password");


      res.json({

        success:true,

        avatar:user.avatar

      });


    }catch(error){

      res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);



/* =========================
   GET ALL VOLUNTEERS
========================= */

app.get(
  "/api/admin/users",
  protect,
  adminOnly,
  async(req,res)=>{

    try{


      const users =
      await User.find({

        role:"volunteer"

      })
      .select("-password")
      .sort({
        createdAt:-1
      });


      res.json({

        success:true,

        count:users.length,

        users

      });


    }catch(error){

      res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);



/* =========================
   BAN / UNBAN VOLUNTEER
========================= */


app.put(
  "/api/admin/users/:id/status",
  protect,
  adminOnly,
  async(req,res)=>{

    try{


      const user =
      await User.findById(
        req.params.id
      );


      if(
        !user ||
        user.role !== "volunteer"
      ){

        return res.status(404).json({

          success:false,
          message:"Volunteer not found"

        });

      }


      user.status =
      user.status === "active"
      ?
      "banned"
      :
      "active";


      await user.save();


      res.json({

        success:true,

        message:
        `User ${user.status}`,

        user

      });


    }catch(error){


      res.status(500).json({

        success:false,
        message:error.message

      });

    }


  }
);



/* =========================
   DELETE VOLUNTEER
========================= */


app.delete(
  "/api/admin/users/:id",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const user =
      await User.findById(
        req.params.id
      );


      if(
        !user ||
        user.role !== "volunteer"
      ){

        return res.status(404).json({

          success:false,
          message:"Volunteer not found"

        });

      }


      await Application.deleteMany({
        volunteerId:user._id
      });


      await Certificate.deleteMany({
        volunteerId:user._id
      });


      await User.findByIdAndDelete(
        user._id
      );


      res.json({

        success:true,

        message:"Volunteer deleted"

      });


    }catch(error){

      res.status(500).json({

        success:false,
        message:error.message

      });

    }

  }
);



/* =========================
   CONTACT FORM
========================= */


app.post(
  "/api/contact",
  async(req,res)=>{


    try{


      const contact =
      await Contact.create({

        name:req.body.name,

        email:req.body.email,

        subject:req.body.subject,

        message:req.body.message

      });


      res.status(201).json({

        success:true,

        message:"Message sent",

        contact

      });


    }catch(error){


      res.status(500).json({

        success:false,
        message:error.message

      });

    }


  }
);



/* =========================
   ADMIN GET CONTACTS
========================= */


app.get(
  "/api/admin/contacts",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const contacts =
      await Contact.find()
      .sort({
        createdAt:-1
      });


      res.json({

        success:true,

        count:contacts.length,

        contacts

      });


    }catch(error){


      res.status(500).json({

        success:false,
        message:error.message

      });

    }


  }
);



/* =========================
   DELETE CONTACT
========================= */


app.delete(
  "/api/admin/contacts/:id",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      await Contact.findByIdAndDelete(
        req.params.id
      );


      res.json({

        success:true,

        message:"Contact deleted"

      });


    }catch(error){

      res.status(500).json({

        success:false,
        message:error.message

      });

    }

  }
);



/* =========================
   SEARCH + FILTER CAMPAIGNS
========================= */


app.get(
  "/api/search/campaigns",
  async(req,res)=>{


    try{


      const page =
      Number(req.query.page) || 1;


      const limit = 6;


      const query = {};


      if(req.query.keyword){

        query.title = {
          $regex:req.query.keyword,
          $options:"i"
        };

      }


      if(req.query.category){

        query.category =
        req.query.category;

      }


      if(req.query.location){

        query.location = {
          $regex:req.query.location,
          $options:"i"
        };

      }


      const campaigns =
      await Campaign.find(query)

      .sort({
        createdAt:-1
      })

      .skip(
        (page-1)*limit
      )

      .limit(limit);


      const total =
      await Campaign.countDocuments(query);


      res.json({

        success:true,

        page,

        totalPages:
        Math.ceil(total/limit),

        count:campaigns.length,

        campaigns

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);



/* =========================
   AI CHAT HELPER
========================= */

async function askAI(systemPrompt, message) {

  const response = await axios.post(

    GROQ_URL,

    {

      model: AI_MODEL,

      messages: [

        {
          role: "system",
          content: systemPrompt
        },

        {
          role: "user",
          content: message
        }

      ],

      temperature: 0.7,

      max_tokens: 1000

    },

    {

      headers: {

        Authorization:
          `Bearer ${process.env.GROQ_API_KEY}`,

        "Content-Type":
          "application/json"

      }

    }

  );


  return response.data
    .choices[0]
    .message.content;

}


/* =========================
   NGO AI ASSISTANT
========================= */


app.post(
  "/api/ai/chat",
  async(req,res)=>{


    try{


      const reply =
      await askAI(

`
You are NayePankh AI Assistant.

About NGO:
- NayePankh works in education, environment, healthcare, social awareness and skill development.

Your job:
- Guide volunteers.
- Explain campaigns.
- Answer NGO related questions.
- Be friendly, professional and motivating.
- Keep answers practical.
`,

      req.body.message

      );


      res.json({

        success:true,

        reply

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:"AI service failed"

      });

    }


  }
);



/* =========================
   AI CAMPAIGN RECOMMENDATION
========================= */


app.post(
  "/api/ai/recommend",
  protect,
  async(req,res)=>{


    try{


      const profile = `
Skills:
${req.user.skills.join(", ")}

Interests:
${req.user.interests.join(", ")}

City:
${req.user.city}
`;


      const reply =
      await askAI(

`
You are a volunteer career advisor.

Analyze the user profile and recommend:
- Suitable NGO activities
- Campaign categories
- Skills they should improve

Give clear bullet points.
`,

profile

      );


      res.json({

        success:true,

        recommendation:reply

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);



/* =========================
   ADMIN AI CAMPAIGN WRITER
========================= */


app.post(
  "/api/admin/ai/campaign",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const reply =
      await askAI(

`
You are an NGO content writer.

Generate a professional campaign including:

- Title
- Short Description
- Objectives
- Volunteer Roles
- Impact

Make it attractive.
`,

req.body.topic

      );


      res.json({

        success:true,

        content:reply

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);



/* =========================
   AI SOCIAL MEDIA POST
========================= */


app.post(
  "/api/admin/ai/post",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const reply =
      await askAI(

`
You are a social media manager for NayePankh Foundation.

Create an engaging social media post.

Include:
- Attractive opening
- Main message
- Call to action
- Relevant hashtags

Keep it inspiring.
`,

req.body.topic

      );


      res.json({

        success:true,

        post:reply

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);


/* =========================
   CERTIFICATE ID GENERATOR
========================= */

function generateCertificateId() {

  const year =
  new Date().getFullYear();


  const random =
  crypto.randomBytes(3)
  .toString("hex")
  .toUpperCase();


  return `NP-${year}-${random}`;
}

/* =========================
   GENERATE CERTIFICATE PDF
========================= */

async function createCertificatePDF(
  volunteer,
  campaign,
  certificateId,
  qrBuffer
) {


return new Promise((resolve)=>{


const doc =
new PDFDocument({

  size:"A4",

  margin:50

});


const chunks = [];


doc.on(
"data",
chunk => chunks.push(chunk)
);


doc.on(
"end",
()=>{

resolve(
Buffer.concat(chunks)
);

});


/* Design */

doc
.fontSize(28)
.fillColor("#0f766e")
.text(
"NayePankh Foundation",
{
align:"center"
}
);


doc.moveDown();


doc
.fontSize(22)
.fillColor("black")
.text(
"Certificate of Appreciation",
{
align:"center"
}
);


doc.moveDown(2);


doc
.fontSize(16)
.text(
"This certificate is proudly presented to",
{
align:"center"
}
);


doc.moveDown();


doc
.fontSize(30)
.fillColor("#22c55e")
.text(
volunteer.name,
{
align:"center"
}
);


doc.moveDown();


doc
.fontSize(15)
.fillColor("black")
.text(
`For successfully participating in "${campaign.title}"`,
{
align:"center"
}
);


doc.moveDown(2);


doc.text(
`Category: ${campaign.category}`,
{
align:"center"
}
);


doc.text(
`Location: ${campaign.location}`,
{
align:"center"
}
);


doc.moveDown();


doc.text(
`Certificate ID: ${certificateId}`,
{
align:"center"
}
);


doc.moveDown(2);


/* QR */

if(qrBuffer){

doc.image(
qrBuffer,
230,
520,
{
width:100
}
);

}


doc.fontSize(10)
.text(
"Scan QR to verify certificate",
{
align:"center"
}
);


doc.moveDown(3);


doc.text(
`Issued Date: ${
new Date()
.toLocaleDateString()
}`,
{
align:"left"
}
);


doc.text(
"Authorized By: NayePankh Foundation",
{
align:"right"
}
);


/* Finish */

doc.end();


});


}

/* =========================
   UPLOAD PDF TO CLOUDINARY
========================= */

function uploadPDF(buffer) {

  return new Promise((resolve, reject)=>{


    const stream =
    cloudinary.uploader.upload_stream(

      {

        folder:
        "nayepankh-certificates",

        resource_type:
        "raw"

      },


      (error, result)=>{


        if(error) {

          reject(error);

        }

        else {

          resolve(result);

        }

      }

    );


    streamifier
    .createReadStream(buffer)
    .pipe(stream);


  });

}


/* =========================
   GENERATE CERTIFICATE
========================= */

app.post(
  "/api/admin/certificate/:applicationId",
  protect,
  adminOnly,
  async (req, res) => {

    try {

      const application =
      await Application.findById(
        req.params.applicationId
      )
      .populate("volunteerId")
      .populate("campaignId");


      if (!application) {

        return res.status(404).json({
          success:false,
          message:"Application not found"
        });

      }


      if (application.status !== "approved") {

        return res.status(400).json({
          success:false,
          message:"Volunteer is not approved"
        });

      }


      // Prevent duplicate certificates

      const exists =
      await Certificate.findOne({

        volunteerId:
        application.volunteerId._id,

        campaignId:
        application.campaignId._id

      });


      if (exists) {

        return res.status(400).json({

          success:false,

          message:"Certificate already generated"

        });

      }


      const certificateId =
      generateCertificateId();


      // QR contains verification URL

      const qrData =
      `${req.protocol}://${req.get("host")}/api/certificate/verify/${certificateId}`;


      const qrBuffer =
      await QRCode.toBuffer(qrData);


      // Generate PDF

      const pdfBuffer =
      await createCertificatePDF(

        application.volunteerId,

        application.campaignId,

        certificateId,

        qrBuffer

      );


      // Upload to Cloudinary

      const uploadResult =
      await uploadPDF(pdfBuffer);


      // Save certificate

      const certificate =
      await Certificate.create({

        certificateId,

        volunteerId:
        application.volunteerId._id,

        campaignId:
        application.campaignId._id,

        pdfUrl:
        uploadResult.secure_url,

        qrCode:
        qrData,

        issuedBy:
        req.user._id

      });


      res.status(201).json({

        success:true,

        message:
        "Certificate generated successfully",

        certificate

      });


    } catch(error) {


      res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);
/* =========================
   MY CERTIFICATES
========================= */

app.get(
  "/api/my-certificates",
  protect,
  async (req,res)=>{

    try{

      const certificates =
      await Certificate.find({
        volunteerId:req.user._id
      })
      .populate(
        "campaignId",
        "title category eventDate"
      )
      .sort({
        createdAt:-1
      });


      res.json({

        success:true,

        count:certificates.length,

        certificates

      });


    }catch(error){

      res.status(500).json({

        success:false,
        message:error.message

      });

    }

  }
);

/* =========================
   VERIFY CERTIFICATE
========================= */

app.get(
  "/api/certificate/verify/:certificateId",
  async(req,res)=>{

    try{

      const certificate =
      await Certificate.findOne({

        certificateId:
        req.params.certificateId

      })
      .populate(
        "volunteerId",
        "name email"
      )
      .populate(
        "campaignId",
        "title category"
      );


      if(
        !certificate ||
        certificate.status==="revoked"
      ){

        return res.status(404).json({

          success:false,

          valid:false,

          message:
          "Invalid certificate"

        });

      }


      res.json({

        success:true,

        valid:true,

        certificate

      });


    }catch(error){

      res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);
/* =========================
   ALL CERTIFICATES
========================= */


app.get(
  "/api/admin/certificates",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const certificates =
      await Certificate.find()

      .populate(
        "volunteerId",
        "name email"
      )

      .populate(
        "campaignId",
        "title category"
      )

      .sort({
        createdAt:-1
      });


      res.json({

        success:true,

        count:certificates.length,

        certificates

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);
/* =========================
   DELETE CERTIFICATE
========================= */


app.put(
  "/api/admin/certificate/revoke/:id",
  protect,
  adminOnly,
  async(req,res)=>{

    try{

      const certificate =
      await Certificate.findById(
        req.params.id
      );


      if(!certificate){

        return res.status(404).json({
          success:false,
          message:"Certificate not found"
        });

      }


      certificate.status = "revoked";


      await certificate.save();


      res.json({

        success:true,

        message:"Certificate revoked successfully"

      });


    }catch(error){

      res.status(500).json({

        success:false,
        message:error.message

      });

    }

  }
);
/* =========================
   ADMIN DASHBOARD
========================= */


app.get(
  "/api/admin/dashboard",
  protect,
  adminOnly,
  async(req,res)=>{


    try{


      const totalVolunteers =
      await User.countDocuments({
        role:"volunteer"
      });


      const totalCampaigns =
      await Campaign.countDocuments();


      const totalApplications =
      await Application.countDocuments();


      const totalCertificates =
      await Certificate.countDocuments();


      res.json({

        success:true,

        stats:{

          totalVolunteers,

          totalCampaigns,

          totalApplications,

          totalCertificates

        }

      });


    }catch(error){


      res.status(500).json({

        success:false,

        message:error.message

      });

    }


  }
);

/* =========================
   GET MY NOTIFICATIONS
========================= */

app.get(
  "/api/notifications",
  protect,
  async(req,res)=>{

    const notifications =
    await Notification.find({
      userId:req.user._id
    })
    .sort({createdAt:-1});


    res.json({
      success:true,
      notifications
    });

  }
);



/* =========================
   MARK NOTIFICATION READ
========================= */

app.put(
  "/api/notifications/:id",
  protect,
  async(req,res)=>{

    await Notification.findByIdAndUpdate(
      req.params.id,
      {
        isRead:true
      }
    );


    res.json({
      success:true,
      message:"Notification marked as read"
    });

  }
);


/* =========================
   SYSTEM HELPERS
========================= */


async function sendNotification(
  userId,
  title,
  message
){

  await Notification.create({

    userId,
    title,
    message

  });

}



async function addActivity(
  adminId,
  action,
  details=""
){

  await Activity.create({

    adminId,
    action,
    details

  });

}



async function giveBadge(
  userId,
  badge
){

  const user =
  await User.findById(userId);


  if(
    user &&
    !user.badges.includes(badge)
  ){

    user.badges.push(badge);

    await user.save();


    await sendNotification(
      userId,
      "🏆 New Badge Earned",
      `Congratulations! You earned ${badge}`
    );

  }

}

/* =========================
   ADMIN GET ACTIVITY LOGS
========================= */

app.get(
  "/api/admin/activity",
  protect,
  adminOnly,
  async(req,res)=>{

    const activities =
    await Activity.find()
    .populate(
      "adminId",
      "name email"
    )
    .sort({
      createdAt:-1
    });


    res.json({
      success:true,
      activities
    });

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