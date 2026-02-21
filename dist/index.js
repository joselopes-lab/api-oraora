"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables from .env file
require('dotenv').config();
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit")); // Import express-rate-limit
const generative_ai_1 = require("@google/generative-ai");
// Import routers
const properties_1 = __importDefault(require("./routes/properties"));
const olx_1 = __importDefault(require("./routes/olx"));
const auth_1 = __importDefault(require("./routes/auth")); // Import the new auth router
const chatbot_1 = __importDefault(require("./routes/chatbot"));
const app = (0, express_1.default)();
// --- Middleware ---
app.use(express_1.default.json());
const limiter = (0, express_rate_limit_1.default)({
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
// Use a generic router for all api routes
app.use('/api', auth_1.default); // Add the auth router
app.use('/api', properties_1.default);
app.use('/api', olx_1.default);
app.use('/api', chatbot_1.default);
// Keep the generate route here for now, or move it to its own file later
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use a recent, powerful model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Send the generated text back to the client
    res.json({ generatedText: text });
});
// --- Centralized Error Handling ---
app.use((err, req, res, next) => {
    console.error("An unexpected error occurred:", err);
    res.status(500).json({ error: 'An internal server error occurred.' });
});
const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
//# sourceMappingURL=index.js.map