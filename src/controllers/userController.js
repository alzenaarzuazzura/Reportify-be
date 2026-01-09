const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const { search, role, sortBy, order, page, limit } = req.query;

    // Build where clause
    const where = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Build orderBy clause
    const validSortFields = ['id', 'name', 'email', 'role', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'id';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    const orderBy = { [sortField]: sortOrder };

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.users.count({ where });

    // Get users with filters, sort, and pagination
    const users = await prisma.users.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });

    // Return with pagination metadata
    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data users',
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getAllUsers:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data users')
    );
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json(
        errorResponse('User tidak ditemukan')
      );
    }

    return res.status(200).json(
      successResponse('Berhasil mengambil data user', user)
    );
  } catch (error) {
    console.error('Error getUserById:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data user')
    );
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validasi input
    if (!name || !email || !password || !role) {
      return res.status(400).json(
        errorResponse('Semua field wajib diisi')
      );
    }

    // Cek email sudah ada
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json(
        errorResponse('Email sudah terdaftar')
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });

    return res.status(201).json(
      successResponse('User berhasil dibuat', user)
    );
  } catch (error) {
    console.error('Error createUser:', error);
    return res.status(500).json(
      errorResponse('Gagal membuat user')
    );
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Cek user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json(
        errorResponse('User tidak ditemukan')
      );
    }

    // Cek email conflict jika email diubah
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json(
          errorResponse('Email sudah digunakan oleh user lain')
        );
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.users.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });

    return res.status(200).json(
      successResponse('User berhasil diupdate', user)
    );
  } catch (error) {
    console.error('Error updateUser:', error);
    return res.status(500).json(
      errorResponse('Gagal mengupdate user')
    );
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json(
        errorResponse('User tidak ditemukan')
      );
    }

    await prisma.users.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json(
      successResponse('User berhasil dihapus', { id: parseInt(id) })
    );
  } catch (error) {
    console.error('Error deleteUser:', error);
    return res.status(500).json(
      errorResponse('Gagal menghapus user')
    );
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
