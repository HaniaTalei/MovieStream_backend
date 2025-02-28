const { query } = require('../config/db');

// Get all movies with pagination
exports.getMovies = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  try {
    // Count total movies
    const countResult = await query('SELECT COUNT(*) FROM movies');
    const total = parseInt(countResult.rows[0].count);

    // Get movies with pagination
    const moviesResult = await query(
      'SELECT * FROM movies ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      movies: moviesResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getMovieById = async (req, res) => {
  const { id } = req.params;

  try {
    const movieId = Number(id); 

    if (isNaN(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }

    const result = await query('SELECT * FROM movies WHERE id = $1', [movieId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.rateMovie = async (req, res) => {
  const { movieId, rating } = req.body;
  const userId = req.user.id;
  try {
    const result = await query(
      'INSERT INTO ratings (user_id, movie_id, rating) VALUES ($1, $2, $3) RETURNING *',
      [userId, movieId, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error rating movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Add new movie (admin only)
exports.addMovie = async (req, res) => {
  const { 
    title, 
    description, 
    poster_url, 
    video_url, 
    release_year, 
    duration, 
    genres, 
    type = 'movie' 
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO movies 
       (title, description, poster_url, video_url, release_year, duration, genres, type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [title, description, poster_url, video_url, release_year, duration, genres, type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update movie (admin only)
exports.updateMovie = async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    poster_url, 
    video_url, 
    release_year, 
    duration, 
    genres, 
    type 
  } = req.body;

  try {
    const result = await query(
      `UPDATE movies 
       SET title = $1, description = $2, poster_url = $3, video_url = $4, 
           release_year = $5, duration = $6, genres = $7, type = $8 
       WHERE id = $9 
       RETURNING *`,
      [title, description, poster_url, video_url, release_year, duration, genres, type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete movie (admin only)
exports.deleteMovie = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM movies WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


