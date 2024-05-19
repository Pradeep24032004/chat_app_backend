const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://664a2dc333bf64dcd3c78441--resonant-mousse-9899c4.netlify.app'], // Add your Netlify URL here
    methods: ["GET", "POST"],
    allowedHeaders: ['Authorization'],
    credentials: true
  }
});

app.use(cors({
  origin: ['http://localhost:3000', 'https://664a2dc333bf64dcd3c78441--resonant-mousse-9899c4.netlify.app'], // Add your Netlify URL here
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization'],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://pradeep24032004:Nps23JRnixKHWV9A@chatapp.7dl7wsr.mongodb.net/?retryWrites=true&w=majority&appName=chatapp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas and models
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  user: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
}));

// Authentication endpoints
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
  }

  try {
    // If username doesn't exist, proceed with signup
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ user: { username: user.username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ user: { username: user.username } });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Messages endpoint
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort('createdAt');
  res.json(messages);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('message', async (message) => {
    const newMessage = new Message(message);
    await newMessage.save();
    io.emit('message', newMessage); // Broadcast the message to all clients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
