const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Email dan password wajib diisi')
      );
    }

    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json(
        errorResponse('Email atau password salah')
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(
        errorResponse('Email atau password salah')
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const loginData = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    return res.status(200).json(
      successResponse('Login berhasil', loginData)
    );
  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json(
      errorResponse('Gagal melakukan login')
    );
  }
};

const logout = async (req, res) => {
  try {
    return res.status(200).json(
      successResponse('Logout berhasil', null)
    );
  } catch (error) {
    console.error('Error logout:', error);
    return res.status(500).json(
      errorResponse('Gagal melakukan logout')
    );
  }
};

module.exports = { login, logout };
