const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const commentRoutes = require('./routes/comment.routes');
const ratingRoutes = require('./routes/rating.routes');

const app = express();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(bodyParser.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Use routes
app.use('/auth', authRoutes);
app.use('/movies', movieRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/movies', commentRoutes);

app.use('/rates', movieRoutes);


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});