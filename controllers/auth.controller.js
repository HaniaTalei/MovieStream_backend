const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db'); // فایل اتصال به دیتابیس
require('dotenv').config();

// ثبت‌نام کاربر جدید
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // بررسی وجود کاربر با ایمیل مشابه
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // هش کردن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ذخیره کاربر در دیتابیس
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'user'] // نقش پیش‌فرض کاربر "user" است
    );

    const newUser = result.rows[0];

    // ساخت توکن JWT
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // اعتبار توکن برای 7 روز
    );

    // پاسخ به کلاینت
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// ورود کاربر
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // جستجوی کاربر با ایمیل
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // بررسی صحت رمز عبور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ساخت توکن JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // اعتبار توکن برای 7 روز
    );

    // حذف رمز عبور از اطلاعات کاربر برای امنیت
    const { password: _, ...userWithoutPassword } = user;

    // پاسخ به کلاینت
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

// دریافت اطلاعات کاربر جاری
exports.getCurrentUser = async (req, res) => {
  try {
    // جستجوی کاربر با ID موجود در توکن JWT
    const result = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // پاسخ به کلاینت
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error getting user data' });
  }
};

// خروج کاربر
exports.logout = (req, res) => {
  // با استفاده از JWT، خروج به صورت سمت کلاینت مدیریت می‌شود (حذف توکن)
  res.status(200).json({ message: 'Logout successful' });
};