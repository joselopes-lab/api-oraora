"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Dummy user for demonstration purposes
const user = {
    id: 1,
    username: 'testuser',
    password: 'password'
};
router.post('/signin', (req, res) => {
    // In a real application, you would validate the user's credentials against a database
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
        const accessToken = jsonwebtoken_1.default.sign({ username: user.username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    }
    else {
        res.status(401).send('Username or password incorrect');
    }
});
router.get('/protected', auth_1.authenticateToken, (req, res) => {
    res.send('This is a protected route');
});
exports.default = router;
//# sourceMappingURL=auth.js.map