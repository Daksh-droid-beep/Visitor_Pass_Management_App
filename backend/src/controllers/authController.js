import { User } from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { sendRegistrationSuccessEmail, sendOTPEmail, sendOTPVerifiedEmail } from '../services/emailService.js';
import path from 'path';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Register User
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Capture photo if uploaded
    let profilePhoto = '';
    if (req.file) {
      profilePhoto = `src/uploads/${req.file.filename}`;
    }

    // Create user. For ADMIN, EMPLOYEE, SECURITY roles we can set isVerified = true initially to ease admin setups.
    // Visitors must verify their email.
    const isVisitor = role === 'VISITOR' || !role;
    const isVerified = !isVisitor; // Admin, Employees, Security active by default.

    const user = new User({
      name,
      email,
      password,
      role: role || 'VISITOR',
      phone,
      department,
      profilePhoto,
      isVerified
    });

    // Generate and attach OTP for verification if they are not verified yet
    if (!isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    }

    await user.save();
    
    // Log audit action
    await logAudit({
      userId: user._id,
      action: 'USER_CREATION',
      req,
      details: `Registered user account with role ${user.role} and email ${user.email}`
    });

    // Send notifications
    await sendRegistrationSuccessEmail(user);
    if (!isVerified && user.otp) {
      await sendOTPEmail(user.email, user.otp);
    }

    res.status(201).json({
      success: true,
      message: isVerified 
        ? 'Registration successful! You can now log in.' 
        : 'Registration successful! Verification OTP sent to email.',
      userId: user._id,
      email: user.email,
      isVerified: user.isVerified
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login User
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status.toLowerCase()}. Please contact the administrator.`
      });
    }

    if (!user.isVerified) {
      // If user is not verified, trigger OTP and prompt user
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      await sendOTPEmail(user.email, otp);

      return res.status(403).json({
        success: false,
        message: 'Account not verified. A verification OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Log login audit action
    await logAudit({
      userId: user._id,
      action: 'LOGIN',
      req,
      details: 'Logged in successfully via email/password'
    });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token: accessToken,
      refreshToken,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP manually
 * POST /api/auth/send-otp
 */
export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Log verification audit action
    await logAudit({
      userId: user._id,
      action: 'EMAIL_VERIFIED',
      req,
      details: 'Email verified successfully via 6-digit OTP code'
    });

    await sendOTPVerifiedEmail(user);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get User Profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Employees (Hosts)
 * GET /api/auth/employees
 */
export const getEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'EMPLOYEE' }).select('name email department');
    res.status(200).json({
      success: true,
      employees
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Users (Admin only)
 * GET /api/auth/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User (Admin only)
 * DELETE /api/auth/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Details & Status (Admin only)
 * PUT /api/auth/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, phone, department, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.phone = phone !== undefined ? phone : user.phone;
    user.department = department !== undefined ? department : user.department;
    user.status = status || user.status;

    await user.save();

    await logAudit({
      userId: req.user._id,
      action: 'USER_UPDATED',
      req,
      details: `Updated details/status for user: ${user.email} (Status: ${user.status})`
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset User Password (Admin only)
 * PUT /api/auth/users/:id/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const defaultPass = newPassword || 'password123';
    user.password = defaultPass;
    await user.save();

    await logAudit({
      userId: req.user._id,
      action: 'PASSWORD_RESET',
      req,
      details: `Reset password for user: ${user.email}`
    });

    res.status(200).json({
      success: true,
      message: `Password reset successfully. New password is: ${defaultPass}`
    });
  } catch (error) {
    next(error);
  }
};



