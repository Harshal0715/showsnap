import crypto from 'crypto'; 
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import logger from '../utils/logger.js';

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>🎉 Welcome to ShowSnap!</h2>
      <p>Hi ${name},</p>
      <p>Your account is ready. Start booking your favorite movies now!</p>
      <p>Enjoy the cinematic experience 🍿</p>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: 'Welcome to ShowSnap!',
    html,
    text: `Hi ${name}, your account is ready. Enjoy booking your favorite movies!`,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>Hi there,</p>
      <p>You have requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: 'ShowSnap Password Reset',
    html,
    text: `Hi, you requested a password reset. Please click this link to reset your password: ${resetUrl}. This link is valid for 1 hour.`,
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
    });
    await user.save();
    try {
      await sendWelcomeEmail(user.email, user.name);
      logger.info(`📧 Welcome email sent to ${user.email}`);
    } catch (emailErr) {
      logger.warn(`⚠️ Welcome email failed: ${emailErr.message}`);
    }
    res.status(201).json({
      message: '✅ User registered successfully',
      token: generateToken({ id: user._id, role: user.role }),
      user: user.toJSON(),
    });
  } catch (err) {
    logger.error(`❌ Registration error: ${err.message}`);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({
      message: '✅ Login successful',
      token: generateToken({ id: user._id, role: user.role }),
      user: user.toJSON(),
    });
  } catch (err) {
    logger.error(`❌ Login error: ${err.message}`);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookings');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user.toJSON());
  } catch (err) {
    logger.error(`❌ Profile fetch error: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    if (mobile) user.mobile = mobile.trim();
    if (password) {
      const valid = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password.trim());
      if (!valid) {
        return res.status(400).json({ error: 'Password must contain letters and numbers' });
      }
      user.password = password.trim();
    }
    await user.save({ validateModifiedOnly: true });
    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (err) {
    console.error('❌ Profile update error:', err.message);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000;
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user.email, token);
    logger.info(`📧 Password reset link sent to ${user.email}`);
    res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    logger.error(`❌ Forgot password error: ${err.message}`);
    res.status(500).json({ error: 'Failed to send reset link.' });
  }
};