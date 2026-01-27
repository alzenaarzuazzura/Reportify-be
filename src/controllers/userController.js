const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const { successResponse, errorResponse } = require('../types/apiResponse');
const resetPasswordService = require('../services/resetPasswordService');
const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

const importFromExcel = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        status: false,
        message: 'File Excel tidak ditemukan. Harap upload file dengan nama "file"'
      });
    }

    const file = req.files.file;

    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        status: false,
        message: 'Format file tidak valid. Harap upload file Excel (.xlsx atau .xls)'
      });
    }

    const workbook = xlsx.read(file.data, { type: 'buffer' });

    const sheetName = 'Data Guru';
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(400).json({
        status: false,
        message: `Sheet "${sheetName}" tidak ditemukan. Pastikan nama sheet adalah "Data Guru"`
      });
    }
    
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'File Excel kosong atau tidak ada data'
      });
    }

    const requiredColumns = ['NAMA', 'EMAIL', 'TELEPON', 'ROLE'];
    const allowedRoles = ['admin', 'teacher'];
    const teachers = [];
    const errors = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2;

      const missingColumns = requiredColumns.filter(col => !row[col]);
      if (missingColumns.length > 0) {
        errors.push({
          row: rowNumber,
          message: `Kolom wajib tidak lengkap: ${missingColumns.join(', ')}`
        });
        continue;
      }

      if (!row.NAMA || row.NAMA.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'Nama tidak boleh kosong'
        });
        continue;
      }

      if (!row.EMAIL || row.EMAIL.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'Email tidak boleh kosong'
        });
        continue;
      }   
      
      // Validate role
      if (!row.ROLE || row.ROLE.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'Role tidak boleh kosong'
        });
        continue;
      }
      
      const roleRaw = row.ROLE.toString().trim().toLowerCase();
      
      if (!allowedRoles.includes(roleRaw)) {
        errors.push({
          row: rowNumber,
          message: `Role tidak valid. Hanya boleh: ${allowedRoles.join(', ')}`
        });
        continue;
      }

      teachers.push({
        name: row.NAMA.toString().trim(),
        email: row.EMAIL.toString().trim(),
        phone: row.TELEPON ? row.TELEPON.toString().trim() : null,
        role: roleRaw
      });
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Terdapat kesalahan validasi data',
        errors: errors,
        summary: {
          total: jsonData.length,
          valid: teachers.length,
          invalid: errors.length
        }
      });
    }

    // Import teachers
    const imported = [];
    const importErrors = [];

    for (const teacher of teachers) {
      try {
        // Check if email already exists
        const existingUser = await prisma.users.findUnique({
          where: { email: teacher.email }
        });

        if (existingUser) {
          importErrors.push({
            email: teacher.email,
            message: 'Email sudah terdaftar'
          });
          continue;
        }

        // Generate random password
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123!';
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Create user
        const user = await prisma.users.create({
          data: {
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            password: hashedPassword,
            role: teacher.role
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

        imported.push(user);

        // Send password setup link for teachers
        if (teacher.role === 'teacher') {
          try {
            const { resetLink } = await resetPasswordService.createResetToken(user.id, 60);
            
            // Try WhatsApp first
            if (user.phone) {
              await whatsappService.sendResetPasswordLink(user, resetLink);
            } else {
              // Fallback to Email
              await emailService.sendResetPasswordLink(user, resetLink);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to send notification to ${user.name}:`, error.message);
          }
        }
      } catch (error) {
        importErrors.push({
          email: teacher.email,
          message: error.message
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: 'Import data guru berhasil',
      data: {
        imported: imported,
        summary: {
          total: teachers.length,
          success: imported.length,
          failed: importErrors.length
        },
        errors: importErrors.length > 0 ? importErrors : undefined
      }
    });

  } catch (error) {
    console.error('Error importing teachers:', error);
    return res.status(500).json({
      status: false,
      message: 'Gagal mengimport data guru',
      error: error.message
    });
  }
};

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
    if (!name || !email || !role) {
      return res.status(400).json(
        errorResponse('Nama, email, dan role wajib diisi')
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
        phone: phone || null,
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

    // Jika user adalah teacher, kirim link set password via WhatsApp/Email
    if (roleEnum === 'teacher') {
      console.log(`\n📤 Sending set password link to teacher: ${name}`);
      
      try {
        // Generate reset token & link
        const { resetLink } = await resetPasswordService.createResetToken(user.id, 60);
        
        // Try WhatsApp first
        let deliverySuccess = false;
        let deliveryChannel = null;
        
        if (phone) {
          const waResult = await whatsappService.sendResetPasswordLink(user, resetLink);
          if (waResult.success) {
            deliverySuccess = true;
            deliveryChannel = 'WhatsApp';
            console.log('✅ WhatsApp notification sent');
          }
        }
        
        // Fallback to Email
        if (!deliverySuccess) {
          const emailResult = await emailService.sendResetPasswordLink(user, resetLink);
          if (emailResult.success) {
            deliverySuccess = true;
            deliveryChannel = 'Email';
            console.log('✅ Email notification sent');
          }
        }
        
        if (!deliverySuccess) {
          console.warn('⚠️ Failed to send notification via all channels');
        }
      } catch (error) {
        console.error('⚠️ Error sending notification:', error.message);
        // Tidak gagalkan create user, hanya log warning
      }
    }

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
    if (phone !== undefined) {
      updateData.phone = phone || null;
    };
    
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

const sendPasswordSetupLink = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek user exists dan role teacher
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json(
        errorResponse('User tidak ditemukan')
      );
    }

    if (user.role !== 'teacher') {
      return res.status(400).json(
        errorResponse('Fitur ini hanya untuk teacher')
      );
    }

    console.log(`\n📤 Resending set password link to: ${user.name}`);

    // Generate reset token & link
    const { resetLink, expiresAt } = await resetPasswordService.createResetToken(user.id, 60);

    // Try WhatsApp first
    let deliverySuccess = false;
    let deliveryChannel = null;

    if (user.phone) {
      const waResult = await whatsappService.sendResetPasswordLink(user, resetLink);
      if (waResult.success) {
        deliverySuccess = true;
        deliveryChannel = 'WhatsApp';
        console.log('✅ WhatsApp delivery successful');
      }
    }

    // Fallback to Email
    if (!deliverySuccess) {
      const emailResult = await emailService.sendResetPasswordLink(user, resetLink);
      if (emailResult.success) {
        deliverySuccess = true;
        deliveryChannel = 'Email';
        console.log('✅ Email delivery successful');
      }
    }

    if (deliverySuccess) {
      return res.status(200).json(
        successResponse(
          `Link set password berhasil dikirim via ${deliveryChannel}`,
          { 
            teacherId: user.id,
            teacherName: user.name,
            channel: deliveryChannel,
            expiresAt 
          }
        )
      );
    } else {
      return res.status(500).json(
        errorResponse('Gagal mengirim link set password via semua channel')
      );
    }
  } catch (error) {
    console.error('Error sendPasswordSetupLink:', error);
    return res.status(500).json(
      errorResponse('Gagal mengirim link set password')
    );
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  sendPasswordSetupLink,
  importFromExcel
};
