const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { getMessageUsage } = require('../utils/messageLimit');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

const prisma = new PrismaClient();

// Helper function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, company, password, confirmPassword } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Imię, nazwisko, email i hasło są wymagane' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Nieprawidłowy format email' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Hasło musi mieć minimum 8 znaków' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Hasła nie są identyczne' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik o tym emailu już istnieje' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        company: company || null,
        passwordHash,
        verificationToken,
        verificationTokenExpiry,
        verified: false,
        plan: 'free'
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, firstName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Return response (no token until verified)
    res.status(201).json({
      message: 'Konto utworzone. Sprawdź swoją skrzynkę email, aby zweryfikować konto.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas rejestracji' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email i hasło są wymagane' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    // Check if email is verified
    if (!user.verified) {
      return res.status(403).json({ error: 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return response
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Get message usage stats
    const messageUsage = await getMessageUsage(user.id);

    res.json({
      id: user.id,
      email: user.email,
      plan: user.plan,
      messageUsage
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token weryfikacyjny jest wymagany' });
    }

    // Find user with verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Nieprawidłowy lub wygasły token weryfikacyjny' });
    }

    if (user.verified) {
      return res.status(400).json({ error: 'Konto zostało już zweryfikowane' });
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      return res.status(400).json({ error: 'Token weryfikacyjny wygasł. Zarejestruj się ponownie.' });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }
    });

    res.json({ message: 'Konto zostało pomyślnie zweryfikowane. Możesz się teraz zalogować.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas weryfikacji' });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists to prevent email enumeration
      return res.json({ message: 'Jeśli konto istnieje, wysłaliśmy na nie instrukcje resetowania hasła.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry
      }
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken, user.firstName);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({ error: 'Błąd podczas wysyłania emaila. Spróbuj powonie później.' });
    }

    res.json({ message: 'Jeśli konto istnieje, wysłaliśmy na nie instrukcje resetowania hasła.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas prośby o reset hasła' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token i nowe hasło są wymagane' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Hasło musi mieć minimum 8 znaków' });
    }

    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Nieprawidłowy lub wygasły token resetowania hasła' });
    }

    if (user.resetPasswordExpiry && new Date() > user.resetPasswordExpiry) {
      return res.status(400).json({ error: 'Token resetowania hasła wygasł. Poproś o nowy link.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      }
    });

    res.json({ message: 'Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas zmiany hasła' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword
};
