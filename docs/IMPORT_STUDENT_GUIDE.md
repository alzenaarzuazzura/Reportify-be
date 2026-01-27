# Import Student dari Excel - Panduan Lengkap

## Overview
Fitur import student memungkinkan admin untuk mengimport data siswa dalam jumlah banyak menggunakan file Excel.

## Format File Excel

### Persyaratan File
- **Nama File**: Reportify.xlsx (atau .xls)
- **Nama Sheet**: `Data Siswa` (case-sensitive)
- **Format**: Excel (.xlsx atau .xls)
- **Ukuran Maksimal**: 10MB

### Struktur Kolom

| Kolom | Tipe Data | Wajib | Keterangan |
|-------|-----------|-------|------------|
| nis | String/Number | ✅ Ya | Nomor Induk Siswa (harus unik) |
| nama | String | ✅ Ya | Nama lengkap siswa |
| kelas | Number | ✅ Ya | ID kelas (dari database) |
| telepon orangtua | String | ✅ Ya | Nomor telepon orang tua |
| telepon murid | String | ❌ Tidak | Nomor telepon siswa (opsional) |

### Contoh Data Excel

```
| nis    | nama           | kelas | telepon orangtua | telepon murid  |
|--------|----------------|-------|------------------|----------------|
| 12345  | Budi Santoso   | 1     | 081234567890     | 081234567891   |
| 12346  | Ani Wijaya     | 1     | 081234567892     |                |
| 12347  | Citra Dewi     | 2     | 081234567893     | 081234567894   |
```

## API Endpoint

### Import Students
```http
POST /reportify/students/import
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Body:
- file: Excel file (form-data)
```

### Response Success
```json
{
  "status": true,
  "message": "Import data siswa berhasil",
  "data": {
    "success": [
      {
        "nis": "12345",
        "name": "Budi Santoso",
        "class": "X RPL 1"
      }
    ],
    "failed": [
      {
        "nis": "12346",
        "name": "Ani Wijaya",
        "reason": "NIS sudah terdaftar"
      }
    ],
    "summary": {
      "total": 2,
      "success": 1,
      "failed": 1
    }
  }
}
```

### Response Error - Validation
```json
{
  "status": false,
  "message": "Terdapat kesalahan validasi data",
  "errors": [
    {
      "row": 2,
      "message": "NIS tidak boleh kosong"
    },
    {
      "row": 3,
      "message": "Kelas harus berupa ID kelas yang valid (angka)"
    }
  ],
  "summary": {
    "total": 10,
    "valid": 8,
    "invalid": 2
  }
}
```

### Response Error - File
```json
{
  "status": false,
  "message": "File Excel tidak ditemukan. Harap upload file dengan nama 'file'"
}
```

## Validasi Data

### 1. Validasi File
- ✅ File harus ada
- ✅ Format harus .xlsx atau .xls
- ✅ Ukuran maksimal 10MB
- ✅ Sheet "Data Siswa" harus ada

### 2. Validasi Kolom
- ✅ Kolom wajib harus ada: nis, nama, kelas, telepon orangtua
- ✅ NIS tidak boleh kosong
- ✅ Nama tidak boleh kosong
- ✅ Kelas harus berupa angka (ID kelas)
- ✅ Telepon orangtua tidak boleh kosong

### 3. Validasi Database
- ✅ NIS harus unik (tidak boleh duplikat)
- ✅ ID kelas harus ada di database
- ✅ Jika ada error, data tidak akan diimport

## Cara Mendapatkan ID Kelas

ID kelas dapat diperoleh dari:
1. **API Combo Classes**: `GET /reportify/combo/classes`
2. **Database**: Query langsung ke tabel `classes`
3. **Frontend**: Dari dropdown kelas saat create/edit student

Contoh response combo classes:
```json
{
  "status": true,
  "data": [
    {
      "value": 1,
      "label": "X RPL 1"
    },
    {
      "value": 2,
      "label": "X RPL 2"
    }
  ]
}
```

## Error Handling

### Error yang Mungkin Terjadi

1. **File tidak ditemukan**
   - Pastikan field name adalah "file"
   - Gunakan form-data untuk upload

2. **Format file tidak valid**
   - Gunakan file .xlsx atau .xls
   - Jangan gunakan format lain (csv, txt, dll)

3. **Sheet tidak ditemukan**
   - Pastikan nama sheet adalah "Data Siswa" (case-sensitive)
   - Jangan gunakan nama sheet lain

4. **Kolom tidak lengkap**
   - Pastikan semua kolom wajib ada
   - Nama kolom harus sesuai (case-sensitive)

5. **NIS sudah terdaftar**
   - NIS harus unik
   - Cek database sebelum import

6. **Kelas tidak ditemukan**
   - Pastikan ID kelas valid
   - Cek combo classes untuk ID yang benar

## Tips & Best Practices

### 1. Persiapan Data
- ✅ Validasi data di Excel sebelum import
- ✅ Pastikan NIS unik
- ✅ Gunakan ID kelas yang valid
- ✅ Format nomor telepon konsisten

### 2. Testing
- ✅ Test dengan data kecil dulu (5-10 rows)
- ✅ Cek response untuk melihat error
- ✅ Perbaiki error sebelum import data besar

### 3. Backup
- ✅ Backup database sebelum import besar
- ✅ Simpan file Excel asli
- ✅ Catat hasil import untuk audit

### 4. Performance
- ✅ Import maksimal 1000 siswa per file
- ✅ Untuk data lebih besar, split menjadi beberapa file
- ✅ Import di luar jam sibuk

## Contoh Penggunaan

### cURL
```bash
curl -X POST http://localhost:3000/reportify/students/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@Reportify.xlsx"
```

### JavaScript (Fetch)
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:3000/reportify/students/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Axios
```javascript
const formData = new FormData();
formData.append('file', file);

axios.post('/students/import', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  }
})
.then(response => console.log(response.data));
```

## Troubleshooting

### Problem: "File Excel tidak ditemukan"
**Solution**: Pastikan field name adalah "file" dan menggunakan multipart/form-data

### Problem: "Sheet 'Data Siswa' tidak ditemukan"
**Solution**: Rename sheet menjadi "Data Siswa" (case-sensitive)

### Problem: "NIS sudah terdaftar"
**Solution**: Cek database dan hapus duplikat atau gunakan NIS yang berbeda

### Problem: "Kelas dengan ID X tidak ditemukan"
**Solution**: Cek combo classes untuk mendapatkan ID kelas yang valid

### Problem: "File terlalu besar"
**Solution**: Split file menjadi beberapa bagian (maksimal 10MB per file)

## Security

- ✅ Endpoint protected dengan JWT authentication
- ✅ Hanya admin yang dapat mengakses
- ✅ File size limited (10MB)
- ✅ File type validation (.xlsx, .xls only)
- ✅ Data validation sebelum insert ke database

## Monitoring & Logging

Setiap import akan di-log dengan informasi:
- Timestamp
- User yang melakukan import
- Jumlah data success/failed
- Detail error jika ada

Check log di console server untuk detail.
