exports.getMovies = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  // جستجو و فیلترها
  const searchQuery = req.query.search || '';
  const genres = req.query.genres || '';
  const release_year = req.query.release_year || '';
  const rating = req.query.rating ? parseInt(req.query.rating) : 0;

  try {
    let whereClause = '';
    const queryParams = [];
    let paramCount = 1;

    if (searchQuery) {
      whereClause = `WHERE title ILIKE $${paramCount}`;
      queryParams.push(`%${searchQuery}%`);
      paramCount++;
    }

    // اضافه کردن فیلتر ژانر
    if (genres) {
      whereClause = whereClause
      ? `${whereClause} AND $${paramCount} = ANY(genres)`
      : `WHERE $${paramCount} = ANY(genres)`;
    queryParams.push(genres);
    paramCount++;
    }

    // اضافه کردن فیلتر سال
    if (release_year) {
      if (release_year.endsWith('s')) {
        const decadeStart = release_year.replace('s', '');
        const decadeEnd = parseInt(decadeStart) + 9;
        whereClause = whereClause
          ? `${whereClause} AND release_year BETWEEN $${paramCount} AND $${paramCount + 1}`
          : `WHERE release_year BETWEEN $${paramCount} AND $${paramCount + 1}`;
        queryParams.push(decadeStart, decadeEnd);
        paramCount += 2;
      } else {
        // برای سال‌های خاص
        whereClause = whereClause
          ? `${whereClause} AND release_year = $${paramCount}`
          : `WHERE release_year = $${paramCount}`;
        queryParams.push(release_year);
        paramCount++;
      }
    }

    // شمارش کل فیلم‌های منطبق با فیلتر
    const countQuery = `SELECT COUNT(*) FROM movies ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // دریافت فیلم‌ها با فیلتر و صفحه‌بندی
    const moviesQuery = `
      SELECT m.*, 
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as rating_count
      FROM movies m
      LEFT JOIN ratings r ON m.id = r.movie_id
      ${whereClause}
      GROUP BY m.id
      ${rating > 0 ? `HAVING COALESCE(AVG(r.rating), 0) >= ${rating}` : ''}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);
    const moviesResult = await query(moviesQuery, queryParams);

    res.json({
      movies: moviesResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    type = 'movie',
    rating
  } = req.body;

  try {
    const genresArray = typeof genres === 'string' ? genres.split(',') : genres;
    const result = await query(
      `INSERT INTO movies 
        (title, description, poster_url, video_url, release_year, duration, genres, type, rating) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
      [title, description, poster_url, video_url, release_year, duration, genresArray, type, rating]
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
    genres, // ژانرها به صورت رشته یا آرایه
    type, 
    rating
  } = req.body;

  try {
    // تبدیل ژانرها به آرایه اگر به صورت رشته ارسال شده‌اند
    const genresArray = typeof genres === 'string' ? genres.split(',') : genres;

    const result = await query(
      `UPDATE movies 
        SET title = $1, description = $2, poster_url = $3, video_url = $4, 
            release_year = $5, duration = $6, genres = $7, type = $8 , rating = $9
        WHERE id = $10
        RETURNING *`,
      [title, description, poster_url, video_url, release_year, duration, genresArray, type,rating, id]
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
