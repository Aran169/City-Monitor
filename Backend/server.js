const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();

// Middleware

app.use(cors({
  origin: "*", // You can specify specific origins here, e.g., ['https://citymonitor.netlify.app']
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
}));

app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://City-Monitor:citymonitor1234@city-monitor.04fdi.mongodb.net/City-Monitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(error => console.log('MongoDB connection error:', error));

// User Schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleLogin; // Make password required only if not logging in via Google
    },
    default: "", // Set a default value in case the password is not set
  },
  googleLogin: {
    type: Boolean,
    default: false // Flag to indicate if the user logged in via Google
  }
});


const User = mongoose.model('User', userSchema);

// Registration Route
app.post('/register', async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  // Basic validation
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the user
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages[0] });
    } else {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user', error });
    }
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Send success response with user data
    res.status(200).json({ 
      message: 'Login successful', 
      user: { fullName: user.fullName, email: user.email }  // Send user details
    });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Google Login Route
app.post('/google-login', async (req, res) => {
  const { fullName, email } = req.body;

  try {
    console.log("Received Google login request:", req.body);  // Log the received data

    // Check if user already exists in MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      console.log("User not found. Creating new user...");
      // If the user doesn't exist, create a new one
      user = new User({
        fullName,
        email,
        password: "", // For Google login, you may not have a password
        googleLogin: true // Mark user as logged in via Google
      });
      await user.save();
      console.log("New user created:", user);
    } else {
      console.log("User found in DB:", user);
    }

    // Send success response with user data
    res.status(200).json({
      message: 'Google login successful',
      user: { fullName: user.displayName, email: user.email },
    });
  } catch (error) {
    console.error('Error during Google login:', error);
    res.status(500).json({ message: 'Error during Google login', error });
  }
});



// Listen on a port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
