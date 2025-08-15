import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'",
        "https://checkout.razorpay.com",
        "https://*.razorpay.com",
        "'unsafe-inline'",
        "'unsafe-eval'"
      ],
      imgSrc: ["'self'", "data:", "https:", "https://api.localsoch.com"],
      connectSrc: ["'self'", "https:", "https://api.localsoch.com"],
      frameSrc: [
        "https://checkout.razorpay.com",
        "https://*.razorpay.com"
      ]
    },
  },
}));

// Compression middleware
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle React Router - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 LocalSoch Dashboard server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'dist/public')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 