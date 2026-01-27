# Panduan Fitur Laporan Akhir Sesi Pembelajaran

## Deskripsi Fitur

Fitur ini secara otomatis mendeteksi ketika waktu mengajar guru di suatu kelas telah selesai dan menampilkan dialog yang memberikan opsi untuk mengirim laporan kegiatan pembelajaran ke wali murid melalui WhatsApp.

## Alur Kerja

### 1. Deteksi Waktu Selesai
- Sistem secara otomatis memonitor waktu saat guru sedang mengisi absensi
- Ketika waktu saat ini melewati jam selesai jadwal (end_time), dialog akan muncul
- Dialog hanya muncul sekali per sesi untuk menghindari gangguan berulang

### 2. Dialog Laporan Sesi
Dialog menampilkan:
- **Informasi Jadwal**: Tanggal, mata pelajaran, kelas, waktu
- **Ringkasan Kehadiran**: Jumlah siswa hadir, izin, dan alfa
- **Tugas yang Diberikan**: Daftar tugas dengan deadline (jika ada)
- **Pengumuman**: Daftar pengumuman hari ini (jika ada)

### 3. Opsi Pengguna
Guru memiliki 2 pilihan:
1. **Kirim Laporan**: Mengirim laporan ke semua wali murid via WhatsApp
2. **Tutup**: Menutup dialog tanpa mengirim laporan

### 4. Setelah Laporan Terkirim
- Menampilkan ringkasan pengiriman (berhasil/gagal)
- Tombol "Lihat Jadwal Lain" untuk navigasi ke jadwal berikutnya
- Tombol "Tutup" untuk menutup dialog

## Format Pesan WhatsApp ke Wali Murid

```
*LAPORAN KEGIATAN BELAJAR*

Yth. Orang Tua/Wali dari *[Nama Siswa]*

📅 Tanggal: [Hari, Tanggal Lengkap]
📚 Mata Pelajaran: [Nama Mapel]
👨‍🏫 Guru: [Nama Guru]
🏫 Kelas: [Kelas]
⏰ Waktu: [Jam Mulai] - [Jam Selesai]

*KEHADIRAN*
[✅/📝/❌] Status: [HADIR/IZIN/ALFA]
📌 Catatan: [Catatan jika ada]

*TUGAS YANG DIBERIKAN* (jika ada)
1. [Judul Tugas]
   📝 [Deskripsi]
   ⏰ Deadline: [Tanggal]

*PENGUMUMAN* (jika ada)
1. [Judul Pengumuman]
   [Isi Pengumuman]

Terima kasih atas perhatian dan dukungan Anda.

Hormat kami,
[Nama Guru]
Sekolah Pelita Bangsa
```

## API Endpoints

### 1. Get Class Session Summary
```
GET /reportify/attendances/session-summary
```

**Query Parameters:**
- `id_schedule` (required): ID jadwal
- `date` (required): Tanggal dalam format YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": {
      "id": 1,
      "day": "Senin",
      "start_time": "07:00",
      "end_time": "08:30",
      "teacher": "Ahmad Fauzi",
      "subject": "Matematika",
      "class": "X RPL 1"
    },
    "date": "2024-01-15",
    "attendance": {
      "total": 30,
      "present": 28,
      "permit": 1,
      "absent": 1,
      "details": [...]
    },
    "assignments": [...],
    "announcements": [...]
  }
}
```

### 2. Send Report to Parents
```
POST /reportify/attendances/send-report
```

**Request Body:**
```json
{
  "id_schedule": 1,
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Proses pengiriman laporan selesai",
  "summary": {
    "total": 30,
    "sent": 28,
    "failed": 2
  },
  "sent": [
    {
      "student": "Ahmad",
      "phone": "081234567890",
      "status": "sent"
    }
  ],
  "errors": [
    {
      "student": "Budi",
      "reason": "Nomor telepon wali murid tidak tersedia"
    }
  ]
}
```

## Komponen Frontend

### 1. SessionEndDialog
**Path**: `fe/src/pages/teacher/attendance/components/SessionEndDialog.tsx`

Dialog component yang menampilkan ringkasan sesi dan opsi pengiriman laporan.

**Props:**
- `visible`: boolean - Kontrol visibility dialog
- `onClose`: function - Handler untuk menutup dialog
- `scheduleId`: number - ID jadwal
- `date`: string - Tanggal dalam format YYYY-MM-DD

### 2. useSessionEndDetection
**Path**: `fe/src/pages/teacher/attendance/hooks/useSessionEndDetection.ts`

Custom hook untuk mendeteksi waktu selesai sesi.

**Parameters:**
- `scheduleEndTime`: string - Waktu selesai dalam format HH:mm
- `enabled`: boolean - Enable/disable detection

**Returns:**
- `showDialog`: boolean - Status dialog
- `closeDialog`: function - Fungsi untuk menutup dialog
- `resetDetection`: function - Reset detection state

## Integrasi

### Di Halaman Attendance Create
```tsx
import SessionEndDialog from "./components/SessionEndDialog"
import useSessionEndDetection from "./hooks/useSessionEndDetection"

// Detect when session ends
const { showDialog, closeDialog } = useSessionEndDetection({
  scheduleEndTime: currentSchedule?.end_time,
  enabled: !!currentSchedule && !alreadyRecorded
})

// Render dialog
<SessionEndDialog
  visible={showDialog}
  onClose={closeDialog}
  scheduleId={currentSchedule.id}
  date={dayjs().format('YYYY-MM-DD')}
/>
```

## Catatan Penting

1. **Deteksi Waktu**: Dialog akan muncul ketika waktu saat ini melewati `end_time` dari jadwal
2. **Satu Kali Tampil**: Dialog hanya muncul sekali per sesi untuk menghindari gangguan
3. **WhatsApp Requirement**: Nomor telepon wali murid harus tersedia untuk pengiriman
4. **Error Handling**: Sistem akan mencatat siswa yang gagal dikirim beserta alasannya
5. **Async Process**: Pengiriman WhatsApp dilakukan secara asynchronous untuk setiap wali murid

## Troubleshooting

### Dialog Tidak Muncul
- Pastikan `scheduleEndTime` tersedia
- Cek apakah waktu saat ini sudah melewati `end_time`
- Pastikan `enabled` prop bernilai `true`

### Laporan Gagal Terkirim
- Cek nomor telepon wali murid di database
- Pastikan WhatsApp service berjalan dengan baik
- Cek log error di response untuk detail kegagalan

### Pesan WhatsApp Tidak Sampai
- Verifikasi format nomor telepon (08xxx atau 628xxx)
- Cek konfigurasi WhatsApp API (WA_API_URL, WA_API_USER, WA_API_PASSWORD)
- Pastikan WhatsApp service dapat diakses
