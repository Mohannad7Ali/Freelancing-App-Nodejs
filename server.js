import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/user.route.js";
import gigRoute from "./routes/gig.route.js";
import orderRoute from "./routes/order.route.js";
import conversationRoute from "./routes/conversation.route.js";
import messageRoute from "./routes/message.route.js";
import reviewRoute from "./routes/review.route.js";
import authRoute from "./routes/auth.route.js";
import requestRoute from "./routes/request.route.js";
import projectRoute from "./routes/project.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";

// استيراد الثوابت (إذا كانت موجودة)
let colors, title, options;
try {
  const constants = await import("./constants.js");
  colors = constants.colors;
  title = constants.title;
  options = constants.options;
} catch (error) {
  // إذا لم يكن ملف constants موجوداً، استخدم قيم افتراضية
  colors = {
    bg: { blue: '\x1b[44m', red: '\x1b[41m', yellow: '\x1b[43m' },
    fg: { white: '\x1b[37m', blue: '\x1b[34m', cyan: '\x1b[36m', yellow: '\x1b[33m', green: '\x1b[32m' },
    reset: '\x1b[0m'
  };
  title = "🎯 API Server";
}

const app = express();
dotenv.config();

// إعدادات MongoDB محسنة
mongoose.set("strictQuery", true);

// تحسين اتصال MongoDB مع إعدادات متوافقة مع Render
const connect = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: "majority"
    };

    await mongoose.connect(`mongodb+srv://Mohannad:0980663670ma@cluster0.qcaug9u.mongodb.net/syverrDB?retryWrites=true&w=majority`, connectionOptions);
    console.log(colors.bg.blue + colors.fg.white + 'Connected to MongoDB successfully' + colors.reset);
  } catch (error) {
    console.error(colors.bg.red + 'MongoDB connection error:' + colors.reset, error.message);
    
    // إعادة المحاولة بعد 5 ثواني
    setTimeout(connect, 5000);
  }
};

// إدارة أحداث الاتصال
mongoose.connection.on('disconnected', () => {
  console.log(colors.bg.yellow + 'MongoDB disconnected! Reconnecting...' + colors.reset);
});

mongoose.connection.on('error', (err) => {
  console.error(colors.bg.red + 'MongoDB connection error:' + colors.reset, err);
});

// إعداد CORS للعمل مع Render
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
  process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, '')
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // السماح لطلبات بدون origin (مثل Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middleware الأساسي
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/gigs", gigRoute);
app.use("/api/orders", orderRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/requests", requestRoute);
app.use("/api/projects", projectRoute);

// Health check endpoint لـ Render
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Everything is working correctly!" });
});

// Validate token endpoint
app.get("/api/auth/validate", (req, res) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "You are not authenticated!" });
    }

    jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
      if (err) {
        let errorMessage = "توكن غير صالح";

        if (err.name === "TokenExpiredError") {
          errorMessage = "انتهت صلاحية التوكن، يلزم تسجيل الدخول مجدداً";
        } else if (err.name === "JsonWebTokenError") {
          errorMessage = "توكن مصادقة غير صحيح";
        }

        return res.status(403).json({ message: errorMessage });
      }

      return res.status(200).json({
        valid: true,
        userId: payload.id,
        isSeller: payload.isSeller,
      });
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  
  console.error('Error:', err);
  
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// بدء التشغيل مع معالجة المنافذ لـ Render
const PORT = process.env.PORT || 8800;

const startServer = async () => {
  try {
    await connect();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(colors.fg.blue + title + colors.reset);
      console.log(colors.bg.blue + colors.fg.white + ' Backend server is running! ' + colors.reset);
      console.log(colors.fg.cyan + '➤ ' + colors.fg.yellow + 'Local: ' + colors.fg.green + `http://localhost:${PORT}` + colors.reset);
      
      if (process.env.RENDER_EXTERNAL_URL) {
        console.log(colors.fg.cyan + '➤ ' + colors.fg.yellow + 'External: ' + colors.fg.green + process.env.RENDER_EXTERNAL_URL + colors.reset);
      }
    });
  } catch (error) {
    console.error(colors.bg.red + 'Failed to start server:' + colors.reset, error);
    process.exit(1);
  }
};

startServer();

export default app;