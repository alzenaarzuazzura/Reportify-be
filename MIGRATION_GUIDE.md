# Tutorial Update Database - Menambahkan Kolom Code

## Langkah-langkah Update Database

### 1. Pastikan Prisma Schema Sudah Diupdate

File `prisma/schema.prisma` sudah diupdate dengan menambahkan field `code` pada model `majors` dan `subjects`:

```prisma
model majors {
  id      Int     @id @default(autoincrement())
  name    String  @db.VarChar(50)
  code    String  @unique @db.VarChar(20)  // ← Field baru

  classes classes[]
}

model subjects {
  id   Int    @id @default(autoincrement())
  name String @db.VarChar(100)
  code String @unique @db.VarChar(20)  // ← Field baru

  teaching_assignments teaching_assignments[]
}
```

### 2. Generate Prisma Client

Jalankan command berikut untuk generate Prisma Client dengan schema terbaru:

```bash
npm run prisma:generate
```

atau

```bash
npx prisma generate
```

### 3. Buat Migration File

Jalankan command untuk membuat migration file:

```bash
npm run prisma:migrate
```

atau

```bash
npx prisma migrate dev --name add_code_to_majors_and_subjects
```

Prisma akan:
- Membuat file migration baru di folder `prisma/migrations/`
- Mendeteksi perubahan schema (penambahan kolom `code`)
- Menanyakan apakah Anda ingin melanjutkan

### 4. Jika Ada Data Existing

Jika database sudah memiliki data di tabel `majors` atau `subjects`, Prisma akan memberikan warning karena kolom `code` bersifat `@unique` dan tidak nullable.

**Pilihan 1: Hapus Data Lama (Development)**
```bash
# Reset database (HATI-HATI: Akan menghapus semua data!)
npx prisma migrate reset
```

**Pilihan 2: Tambahkan Default Value Sementara**

Edit file migration yang baru dibuat di `prisma/migrations/[timestamp]_add_code_to_majors_and_subjects/migration.sql`:

```sql
-- AlterTable
ALTER TABLE `majors` ADD COLUMN `code` VARCHAR(20) NOT NULL DEFAULT 'TEMP';

-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `code` VARCHAR(20) NOT NULL DEFAULT 'TEMP';

-- Update existing data dengan code unik
UPDATE `majors` SET `code` = CONCAT('MJR', LPAD(id, 3, '0')) WHERE `code` = 'TEMP';
UPDATE `subjects` SET `code` = CONCAT('SUB', LPAD(id, 3, '0')) WHERE `code` = 'TEMP';

-- Tambahkan unique constraint
ALTER TABLE `majors` ADD UNIQUE INDEX `majors_code_key`(`code`);
ALTER TABLE `subjects` ADD UNIQUE INDEX `subjects_code_key`(`code`);
```

Kemudian jalankan migration:
```bash
npx prisma migrate deploy
```

**Pilihan 3: Manual Update via MySQL**

Jika sudah terlanjur error, bisa manual update via MySQL:

```sql
-- Tambah kolom tanpa constraint dulu
ALTER TABLE majors ADD COLUMN code VARCHAR(20);
ALTER TABLE subjects ADD COLUMN code VARCHAR(20);

-- Update data existing dengan code unik
UPDATE majors SET code = CONCAT('MJR', LPAD(id, 3, '0'));
UPDATE subjects SET code = CONCAT('SUB', LPAD(id, 3, '0'));

-- Tambahkan constraint NOT NULL dan UNIQUE
ALTER TABLE majors MODIFY COLUMN code VARCHAR(20) NOT NULL;
ALTER TABLE majors ADD UNIQUE INDEX majors_code_key(code);

ALTER TABLE subjects MODIFY COLUMN code VARCHAR(20) NOT NULL;
ALTER TABLE subjects ADD UNIQUE INDEX subjects_code_key(code);
```

Setelah itu, mark migration sebagai applied:
```bash
npx prisma migrate resolve --applied add_code_to_majors_and_subjects
```

### 5. Verifikasi Migration

Cek status migration:
```bash
npx prisma migrate status
```

Cek database dengan Prisma Studio:
```bash
npx prisma studio
```

### 6. Test API

Test endpoint yang sudah diupdate:

**Create Major:**
```bash
POST /api/majors
{
  "name": "Rekayasa Perangkat Lunak",
  "code": "RPL"
}
```

**Create Subject:**
```bash
POST /api/subjects
{
  "name": "Matematika",
  "code": "MTK"
}
```

## Troubleshooting

### Error: "Unique constraint failed"

Jika ada duplikat code, pastikan setiap record memiliki code yang unik.

### Error: "Column cannot be null"

Pastikan semua data existing sudah memiliki nilai code sebelum menambahkan constraint NOT NULL.

### Migration Stuck

Reset migration state:
```bash
npx prisma migrate reset
```

**PERINGATAN:** Command ini akan menghapus semua data!

## Best Practice

1. **Backup Database** sebelum migration
   ```bash
   mysqldump -u username -p database_name > backup.sql
   ```

2. **Test di Development** dulu sebelum production

3. **Gunakan Migration History** untuk tracking perubahan

4. **Dokumentasikan** setiap perubahan schema

## Rollback (Jika Diperlukan)

Jika ingin rollback migration:

```bash
# Lihat history migration
npx prisma migrate status

# Rollback ke migration sebelumnya (manual)
# 1. Hapus folder migration terakhir
# 2. Jalankan SQL untuk drop kolom:
```

```sql
ALTER TABLE majors DROP COLUMN code;
ALTER TABLE subjects DROP COLUMN code;
```

```bash
# 3. Generate ulang Prisma Client
npx prisma generate
```
