import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim());
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  }),
);
app.use(express.json());

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cronUrls: [
      {
        name: { type: String },
        url: { type: String },
        schedule: { type: String },
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// POST /api/auth/login
// First-time login creates the user; subsequent logins verify the password.
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    let user = await User.findOne({ username });

    if (!user) {
      // First login – create the user
      const hashed = await bcrypt.hash(password, 12);
      user = await User.create({ username, password: hashed });
    } else {
      // Subsequent login – verify password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cron-urls – fetch saved cron job URLs for the logged-in user
app.get('/api/cron-urls', apiLimiter, authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('cronUrls');
    res.json({ cronUrls: user?.cronUrls ?? [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/cron-urls – save a cron job URL for the logged-in user
app.post('/api/cron-urls', apiLimiter, authenticate, async (req, res) => {
  const { name, url, schedule } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { cronUrls: { name, url, schedule } },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
