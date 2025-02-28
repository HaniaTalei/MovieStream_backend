const { query } = require('../config/db');

// Get average rating for a movie
exports.getMovieRating = async (req, res) => {
  const { movieId } = req.params;
  
  try {
    // Using COALESCE to handle case when there are no ratings
    const result = await query(
      'SELECT COALESCE(AVG(rating), 0)::numeric(10,1) as average_rating, COUNT(*) as rating_count FROM ratings WHERE movie_id = $1',
      [movieId]
    );
    
    res.json({
      movieId,
      averageRating: parseFloat(result.rows[0].average_rating) || 0,
      ratingCount: parseInt(result.rows[0].rating_count)
    });
  } catch (error) {
    console.error('Error fetching movie rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's rating for a specific movie
exports.getUserMovieRating = async (req, res) => {
  const { movieId } = req.params;
  const userId = req.user.id;
  
  try {
    const result = await query(
      'SELECT * FROM ratings WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ rated: false });
    }
    
    res.json({
      rated: true,
      rating: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Rate a movie
exports.rateMovie = async (req, res) => {
  const { movieId } = req.params;
  const { rating } = req.body;
  const userId = req.user.id;
  
  // Validate rating (1-5 scale based on the table constraints)
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  
  try {
    // Check if the movie exists
    const movieCheck = await query('SELECT id FROM movies WHERE id = $1', [movieId]);
    if (movieCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Check if user already rated this movie
    const ratingCheck = await query(
      'SELECT id FROM ratings WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );
    
    let result;
    
    if (ratingCheck.rows.length > 0) {
      // Update existing rating
      result = await query(
        'UPDATE ratings SET rating = $1, created_at = NOW() WHERE user_id = $2 AND movie_id = $3 RETURNING *',
        [rating, userId, movieId]
      );
      
      res.json({
        message: 'Rating updated successfully',
        rating: result.rows[0]
      });
    } else {
      // Create new rating
      result = await query(
        'INSERT INTO ratings (user_id, movie_id, rating) VALUES ($1, $2, $3) RETURNING *',
        [userId, movieId, rating]
      );
      
      res.status(201).json({
        message: 'Rating added successfully',
        rating: result.rows[0]
      });
    }
  } catch (error) {
    console.error('Error rating movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a rating
exports.deleteRating = async (req, res) => {
  const { movieId } = req.params;
  const userId = req.user.id;
  
  try {
    const result = await query(
      'DELETE FROM ratings WHERE user_id = $1 AND movie_id = $2 RETURNING id',
      [userId, movieId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    
    res.json({ message: 'Rating removed successfully' });
  } catch (error) {
    console.error('Error removing rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all ratings by a user (for user profile)
exports.getUserRatings = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    // Count total ratings by this user
    const countResult = await query('SELECT COUNT(*) FROM ratings WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count);
    
    // Get ratings with movie information
    const ratingsResult = await query(
      `SELECT r.*, m.title, m.poster_url, m.release_year 
       FROM ratings r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({
      ratings: ratingsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};