const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const { search, role, sortBy, order, sort, page, limit } = req.query;

    // Build where clause
    const where = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Build orderBy clause - support both sortBy/order and order/sort patterns
    const validSortFields = ['id', 'name', 'email', 'phone', 'role', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : (validSortFields.includes(order) ? order : 'id');
    const sortOrder = (sort === 'desc' || sort === 'asc') ? sort : (order === 'desc' ? 'desc' : 'asc');

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
        phone: true,
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
        phone: true,
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
    const { name, email, phone, password, role } = req.body;

    // Validasi input (password optional, akan di-generate jika tidak ada)
    if (!name || !email || !phone || !role) {
      return res.status(400).json(
        errorResponse('Nama, email, phone, dan role wajib diisi')
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

    // Generate random password jika tidak disediakan
    const finalPassword = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123!';
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Convert role from integer to enum string if needed
    let roleEnum = role;
    if (typeof role === 'number') {
      // Map integer to enum: 1 = admin, 2 = teacher
      roleEnum = role === 1 ? 'admin' : 'teacher';
    } else if (typeof role === 'string') {
      // Validate it's a valid enum
      if (!['admin', 'teacher'].includes(role)) {
        return res.status(400).json(
          errorResponse('Role tidak valid. Harus admin atau teacher')
        );
      }
    }

    const user = await prisma.users.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: roleEnum
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
    const { name, email, phone, password, role } = req.body;

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
    if (phone) updateData.phone = phone;
    
    // Convert role from integer to enum string if needed
    if (role !== undefined) {
      if (typeof role === 'number') {
        // Map integer to enum: 1 = admin, 2 = teacher
        updateData.role = role === 1 ? 'admin' : 'teacher';
      } else if (typeof role === 'string') {
        // Already a string, validate it's a valid enum
        if (['admin', 'teacher'].includes(role)) {
          updateData.role = role;
        }
      }
    }
    
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
        phone: true,
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
