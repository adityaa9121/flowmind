const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const connectDB = require('./utils/db');

const app = express();

// Startup Validation moved to startServer()

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
// Health Check Routes
app.get('/', (req, res) => res.status(200).json({ status: 'ok', service: 'FlowMind API' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'FlowMind API' }));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/automations', require('./routes/automations'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/support', require('./routes/support'));

// Global 404 handler to ensure JSON responses instead of Express HTML
app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error handler
app.use((err, req, res, next) => {
  // Log securely on the server
  console.error('[FATAL] Unhandled Server Error:', err.stack || err);
  
  // Return a generic JSON response to prevent stack traces from leaking
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error', 
    message: err.status ? err.message : 'An unexpected error occurred.' 
  });
});

const startServer = async () => {
  try {
    // 1. Validate Environment Variables
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('\n[FATAL ERROR] MONGODB_URI environment variable is missing.');
      process.exit(1);
    }
    
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      console.error('\n[FATAL ERROR] MONGODB_URI format is invalid. It must start with mongodb:// or mongodb+srv://');
      process.exit(1);
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.error('\n[FATAL ERROR] GEMINI_API_KEY is missing or invalid in backend .env file.');
      console.error('Please configure a valid Google Gemini API key.');
      process.exit(1);
    }

    // 2. Synchronize Database Connection
    // The server will intentionally halt and crash here if MongoDB fails to connect.
    await connectDB();

    // 3. Start Express Server only if DB is ready
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('\n[FATAL ERROR] Server failed to start due to an initialization error:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
