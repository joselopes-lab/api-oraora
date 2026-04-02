
// Load environment variables from .env file
require('dotenv').config();
import 'express-async-errors';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit'; // Import express-rate-limit

// Import routers
import propertiesRouter from './routes/properties';
import olxRouter from './routes/olx';
import authRouter from './routes/auth'; // Import the new auth router
import chatbotRouter from './routes/chatbot';
import cnmRouter from './routes/cnm';
import dnsRouter from './routes/dns';

const app = express();

// --- Middleware ---
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// --- General Setup ---

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

// --- Routes ---

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Use a generic router for all api routes
app.use('/api', authRouter); // Add the auth router
app.use('/api', propertiesRouter);
app.use('/api', olxRouter);
app.use('/api', chatbotRouter);
app.use('/api', cnmRouter);
app.use('/api/dns', dnsRouter);

// --- Centralized Error Handling ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("An unexpected error occurred:", err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
