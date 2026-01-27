# Panduan Import Data Guru dari Excel

## Format File Excel

### Informasi File
- **Nama File**: `Reportify.xlsx` (atau nama lain dengan ekstensi .xlsx/.xls)
- **Nama Sheet**: `Data Guru` (wajib)
- **Format**: Excel (.xlsx atau .xls)

### Struktur Kolom

File Excel harus memiliki kolom-kolom berikut (case-sensitive):

| Kolom | Wajib | Tipe Data | Keterangan |
|-------|-------|-----------|------------|
| NAME | Ya | Text | Nama lengkap guru |
| EMAIL | Ya | Email | Email guru (harus unik) |
| TELEPON | Ya | Text/Number | Nomor telepon guru (untuk WhatsApp) |
| ROLE | Ya | Text | Role: `admin` atau `teacher` |

### Contoh Data

| NAME | EMAIL | TELEPON | ROLE |
|------|-------|---------|------|
| Ahmad Fauzi | ahmad.fauzi@school.com | 081234567890 | teacher |
| Siti Nurhaliza | siti.nurhaliza@school.com | 081234567891 | teacher |
| Budi Santoso | budi.santoso@school.com | 081234567892 | admin |

## Validasi Data

### Validasi yang Dilakukan:
1. **Kolom Wajib**: Semua kolom wajib harus diisi
2. **Email Unik**: Email tidak boleh duplikat dengan data yang sudah ada
3. **Role Valid**: Role hanya boleh `admin` atau `teacher` (case-insensitive)
4. **Format Email**: Email harus valid

### Proses Import:
1. File akan divalidasi terlebih dahulu
2. Jika ada error validasi, proses import akan dibatalkan dan menampilkan daftar error
3. Jika validasi berhasil:
   - Password akan di-generate otomatis untuk setiap user
   - User dengan role `teacher` akan otomatis dikirimkan link setup password via WhatsApp/Email
   - Data berhasil diimport akan ditampilkan

## Response API

### Success Response
```json
{
  "status": true,
  "message": "Import data guru berhasil",
  "data": {
    "imported": [
      {
        "id": 1,
        "name": "Ahmad Fauzi",
        "email": "ahmad.fauzi@school.com",
        "phone": "081234567890",
        "role": "teacher",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "total": 3,
      "success": 2,
      "failed": 1
    },
    "errors": [
      {
        "email": "duplicate@school.com",
        "message": "Email sudah terdaftar"
      }
    ]
  }
}
```

### Error Response (Validasi)
```json
{
  "status": false,
  "message": "Terdapat kesalahan validasi data",
  "errors": [
    {
      "row": 2,
      "message": "Email tidak boleh kosong"
    },
    {
      "row": 3,
      "message": "Role tidak valid. Hanya boleh: admin, teacher"
    }
  ],
  "summary": {
    "total": 10,
    "valid": 8,
    "invalid": 2
  }
}
```

## Catatan Penting

1. **Password Otomatis**: Password akan di-generate secara otomatis dan aman
2. **Notifikasi Teacher**: Guru dengan role `teacher` akan menerima link setup password via:
   - WhatsApp (jika nomor telepon tersedia)
   - Email (sebagai fallback)
3. **Email Unik**: Pastikan email tidak duplikat dalam file Excel maupun dengan data yang sudah ada
4. **Role Case-Insensitive**: Role bisa ditulis `admin`, `ADMIN`, `Admin`, dll (akan dikonversi ke lowercase)
5. **Nomor Telepon**: Format nomor telepon bebas, tapi disarankan format: 08xxxxxxxxxx atau 628xxxxxxxxxx

## Endpoint API

```
POST /reportify/users/import
Content-Type: multipart/form-data

Body:
- file: Excel file (.xlsx atau .xls)
```

## Cara Penggunaan di Frontend

1. Klik tombol "Import Excel" di halaman Teachers
2. Pilih file Excel yang sudah disiapkan
3. Tunggu proses upload dan validasi
4. Jika berhasil, data akan otomatis ter-refresh
5. Jika ada error, akan ditampilkan detail error untuk diperbaiki
