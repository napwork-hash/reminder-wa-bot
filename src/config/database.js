const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse DATABASE_URL: mysql://user:password@host:port/database
const dbUrl = new URL(process.env.DATABASE_URL);

const pool = mysql.createPool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port, 10) || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * Test koneksi database saat startup
 */
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Database MySQL terhubung');
        conn.release();
    } catch (err) {
        console.error('❌ Gagal konek ke MySQL:', err.message);
        process.exit(1);
    }
}

/**
 * Jalankan migrasi database dari schema.sql
 * Buat tabel jika belum ada (CREATE TABLE IF NOT EXISTS)
 */
async function runMigration() {
    try {
        const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Split by semicolon, strip comment lines, filter empty statements
        const statements = schema
            .split(';')
            .map((s) => s.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n').trim())
            .filter((s) => s.length > 0);

        for (const statement of statements) {
            await pool.execute(statement);
        }

        // Auto-migrate: tambahkan kolom created_by jika belum ada
        try {
            await pool.execute('ALTER TABLE reminders ADD COLUMN created_by VARCHAR(100) DEFAULT NULL');
            console.log('✅ Kolom created_by ditambahkan ke tabel reminders');
        } catch (err) {
            // Abaikan error 1060 (Duplicate column name / ER_DUP_FIELDNAME)
            if (err.errno !== 1060) {
                console.warn('⚠️ Gagal auto-migrate kolom created_by:', err.message);
            }
        }

        console.log('✅ Migrasi database berhasil');
    } catch (err) {
        console.error('❌ Gagal migrasi database:', err.message);
        process.exit(1);
    }
}

module.exports = { pool, testConnection, runMigration };

