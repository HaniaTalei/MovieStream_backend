
const { query } = require('../config/db');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate role
  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  // Prevent self-deletion
  if (id === adminId.toString()) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// routes/auth.routes.js


