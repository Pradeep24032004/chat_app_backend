/*const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://664a2b52d8a3d0d9656cbed6--friendly-stroopwafel-8ebb64.netlify.app'], 
    methods: ["GET", "POST"],
    allowedHeaders: ['Authorization'],
    credentials: true
  }
});

//mongoose.connect('mongodb://localhost:27017/chat-app', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb+srv://pradeep24032004:Nps23JRnixKHWV9A@chatapp.7dl7wsr.mongodb.net/?retryWrites=true&w=majority&appName=chatapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
app.use(cors({
  origin: ['http://localhost:3000', 'https://664a2b52d8a3d0d9656cbed6--friendly-stroopwafel-8ebb64.netlify.app'],  // Replace this with your actual Netlify URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization'],
  credentials: true
}));
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = 'secretkey';

// User authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ message: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// Routes
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ user: { username: user.username }, token });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Invalid username or password' });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ message: 'Invalid username or password' });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ user: { username: user.username }, token });
});

app.get('/api/messages', authMiddleware, async (req, res) => {
  const messages = await Message.find();
  res.json(messages);
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('message', async (message) => {
    const newMessage = new Message(message);
    await newMessage.save();
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});*/
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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://pradeep24032004:Nps23JRnixKHWV9A@chatapp.7dl7wsr.mongodb.net/?retryWrites=true&w=majority&appName=chatapp', { useNewUrlParser: true, useUnifiedTopology: true });

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
/*app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.json({ user: { username: user.username } });
});*/
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
