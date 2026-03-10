import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
        .split(",")
        .map((o) => o.trim());

      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());
app.options("*", cors());

// Rate limiter
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

// Cron URL schema
const cronUrlSchema = new mongoose.Schema(
  {
    name: { type: String },
    url: { type: String },
    schedule: { type: String },
  },
  { timestamps: true },
);

const CronUrl = mongoose.model('CronUrl', cronUrlSchema);

// GET /api/cron-urls – fetch all saved cron job URLs
app.get('/api/cron-urls', apiLimiter, async (req, res) => {
  try {
    const cronUrls = await CronUrl.find();
    res.json({ cronUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/cron-urls – save a cron job URL
app.post('/api/cron-urls', apiLimiter, async (req, res) => {
  const { name, url, schedule } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    await CronUrl.create({ name, url, schedule });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
