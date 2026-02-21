import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

const router = Router();

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
    const accessToken = jwt.sign({ username: user.username, id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.json({ accessToken });
  } else {
    res.status(401).send('Username or password incorrect');
  }
});

router.get('/protected', authenticateToken, (req, res) => {
  res.send('This is a protected route');
});

export default router;
