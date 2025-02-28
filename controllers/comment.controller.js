
// const { query } = require('../config/db');

// // Get comments for a movie
// exports.getMovieComments = async (req, res) => {
//   const { movieId } = req.params;
  
//   try {
//     const result = await query(
//       `SELECT c.*, u.name as user_name 
//        FROM comments c
//        JOIN users u ON c.user_id = u.id
//        WHERE c.movie_id = $1 AND c.is_approved = true
//        ORDER BY c.created_at DESC`,
//       [movieId]
//     );

//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Add a comment to a movie
// exports.addComment = async (req, res) => {
//   const { movieId } = req.params;
//   const { content } = req.body;
//   const userId = req.user.id;

//   try {
//     // Check if movie exists
//     const movieCheck = await query('SELECT id FROM movies WHERE id = $1', [movieId]);
    
//     if (movieCheck.rows.length === 0) {
//       return res.status(404).json({ message: 'Movie not found' });
//     }

//     // Add comment
//     const result = await query(
//       `INSERT INTO comments (user_id, movie_id, content, is_approved) 
//        VALUES ($1, $2, $3, $4) 
//        RETURNING *`,
//       [userId, movieId, content, req.user.role === 'admin'] // Auto-approve admin comments
//     );

//     const comment = result.rows[0];
    
//     // Get user name for response
//     const userResult = await query('SELECT name FROM users WHERE id = $1', [userId]);
    
//     res.status(201).json({
//       ...comment,
//       user_name: userResult.rows[0].name
//     });
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Get all comments for admin moderation
// exports.getAllComments = async (req, res) => {
//     try {
//       const result = await query(
//         `SELECT c.*, u.name as user_name, m.title as movie_title
//          FROM comments c
//          JOIN users u ON c.user_id = u.id
//          JOIN movies m ON c.movie_id = m.id
//          ORDER BY c.created_at DESC`
//       );
  
//       res.json(result.rows);
//     } catch (error) {
//       console.error('Error fetching all comments:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };
  
//   // Approve comment (admin only)
//   exports.approveComment = async (req, res) => {
//     const { id } = req.params;
  
//     try {
//       const result = await query(
//         'UPDATE comments SET is_approved = true WHERE id = $1 RETURNING *',
//         [id]
//       );
  
//       if (result.rows.length === 0) {
//         return res.status(404).json({ message: 'Comment not found' });
//       }
  
//       res.json(result.rows[0]);
//     } catch (error) {
//       console.error('Error approving comment:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };
  
//   // Delete comment (admin or comment owner)
//   exports.deleteComment = async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.id;
//     const isAdmin = req.user.role === 'admin';
  
//     try {
//       let query;
//       let params;
  
//       // Admins can delete any comment, users can only delete their own
//       if (isAdmin) {
//         query = 'DELETE FROM comments WHERE id = $1 RETURNING id';
//         params = [id];
//       } else {
//         query = 'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id';
//         params = [id, userId];
//       }
  
//       const result = await query(query, params);
      
//       if (result.rows.length === 0) {
//         return res.status(404).json({ 
//           message: isAdmin ? 'Comment not found' : 'Comment not found or not authorized to delete'
//         });
//       }
  
//       res.json({ message: 'Comment deleted successfully' });
//     } catch (error) {
//       console.error('Error deleting comment:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };
const { query } = require('../config/db');

// Get comments for a movie
exports.getMovieComments = async (req, res) => {
  const { movieId } = req.params;
  
  try {
    const result = await query(
      `SELECT c.*, u.name as user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.movie_id = $1 AND c.is_approved = true
       ORDER BY c.created_at DESC`,
      [movieId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a comment to a movie
exports.addComment = async (req, res) => {
  const { movieId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    // Check if movie exists
    const movieCheck = await query('SELECT id FROM movies WHERE id = $1', [movieId]);
    
    if (movieCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Add comment
    const result = await query(
      `INSERT INTO comments (user_id, movie_id, content, is_approved)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, movieId, content, req.user.role === 'admin'] // Auto-approve admin comments
    );

    const comment = result.rows[0];
    
    // Get user name for response
    const userResult = await query('SELECT name FROM users WHERE id = $1', [userId]);
    
    res.status(201).json({
      ...comment,
      user_name: userResult.rows[0].name
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all comments for admin moderation
exports.getAllComments = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.name as user_name, m.title as movie_title
       FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN movies m ON c.movie_id = m.id
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve comment (admin only)
exports.approveComment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      'UPDATE comments SET is_approved = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete comment (admin or comment owner)
exports.deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    let queryText;
    let params;

    // Admins can delete any comment, users can only delete their own
    if (isAdmin) {
      queryText = 'DELETE FROM comments WHERE id = $1 RETURNING id';
      params = [id];
    } else {
      queryText = 'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id';
      params = [id, userId];
    }

    const result = await query(queryText, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: isAdmin ? 'Comment not found' : 'Comment not found or not authorized to delete'
      });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};