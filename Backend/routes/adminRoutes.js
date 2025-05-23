const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const {
  getAllUsers,
  toggleBlockUser,
  deleteUser,
} = require('../controllers/adminController');


router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return res.json({ message: 'Admin login successful' });
  } else {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
});


router.get('/users', authMiddleware, isAdmin, getAllUsers);
router.patch('/user/:id/block', authMiddleware, isAdmin, toggleBlockUser);
router.delete('/user/:id', authMiddleware, isAdmin, deleteUser);

module.exports = router;
