
const { query } = require('../config/db');

// Get user's watchlist
exports.getWatchlist = async (req, res) => {

console.log('User in request:', req.user);
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const result = await query(
      `SELECT w.*, m.title, m.poster_url, m.release_year, m.type
       FROM watchlist w
       JOIN movies m ON w.movie_id = m.id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add movie to watchlist
exports.addToWatchlist = async (req, res) => {
  const userId = req.user.id;
  const { movieId, status = 'want_to_watch' } = req.body;

  try {
    // Check if movie exists
    const movieCheck = await query('SELECT id FROM movies WHERE id = $1', [movieId]);
    
    if (movieCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Check if already in watchlist
    const watchlistCheck = await query(
      'SELECT id FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );

    if (watchlistCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Movie already in watchlist',
        watchlistId: watchlistCheck.rows[0].id
      });
    }

    // Add to watchlist
    const result = await query(
      `INSERT INTO watchlist (user_id, movie_id, status) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, movieId, status]
    );

    const watchlistItem = result.rows[0];
    
    // Get movie details for response
    const movieResult = await query(
      'SELECT title, poster_url, release_year, type FROM movies WHERE id = $1',
      [movieId]
    );
    
    res.status(201).json({
      ...watchlistItem,
      ...movieResult.rows[0]
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update watchlist item status
exports.updateWatchlistStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  try {
    const result = await query(
      `UPDATE watchlist 
       SET status = $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [status, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Watchlist item not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating watchlist status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove from watchlist
exports.removeFromWatchlist = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await query(
      'DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Watchlist item not found or not authorized' });
    }

    res.json({ message: 'Removed from watchlist successfully' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
