# 🏕️ Camping Rental API - NestJS

Sistem Backend untuk pengelolaan rental alat camping. Proyek ini dibangun untuk memenuhi kriteria technical test dengan standar industri, mencakup keamanan JWT, manajemen database, dokumentasi API, dan automated testing.

## 🚀 Teknologi yang Digunakan

- **Framework**: NestJS + TypeScript
- **ORM**: Prisma
- **Database**: Postgresql
- **Security**: Passport JWT
- **Testing**: Jest & Supertest

## 🏗️ Arsitektur Proyek

Proyek ini menerapkan **Modular Architecture** dengan prinsip **Separation of Concerns**. Struktur folder dibagi menjadi:

- **`src/modules/`**: Logika bisnis inti (Domain) seperti `product` dan `category`.
- **`src/infra/`**: Infrastruktur teknis seperti `auth`, `prisma`, dan `users`.

Pola ini dipilih karena sangat terstruktur, memudahkan pemeliharaan kode (_maintainability_), dan memisahkan antara aturan bisnis dengan detail teknis atau infrastruktur luar.

## 🔒 Fitur Keamanan

- **Global Guard**: Seluruh endpoint diproteksi oleh `JwtAuthGuard`. <!-- secara default melalui `APP_GUARD`.>
- **Public Access**: Menggunakan kustom dekorator `@Public` untuk endpoint yang bersifat terbuka (seperti melihat daftar produk).
- **Data Validation**: Menjamin integritas data input menggunakan `ValidationPipe`.

## 📊 Relasi Database

Sistem mengimplementasikan relasi database sesuai kriteria:

- **One-to-Many**: Satu Kategori (`Category`) dapat memiliki banyak Produk (`Product`).
- Dikelola melalui Prisma ORM untuk menjamin konsistensi data.

## 🧪 Testing

Untuk menjamin kualitas dan keamanan aplikasi, proyek ini menyertakan **End-to-End (E2E) Testing**.
Jalankan perintah berikut:

```bash
npm run test:e2e
```
