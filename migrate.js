/**
 * Standalone migration script
 * Jalankan: pnpm migrate
 */
require('dotenv').config();

const { testConnection, runMigration, pool } = require('./src/config/database');

async function main() {
    console.log('🔧 Running database migration...\n');

    await testConnection();
    await runMigration();

    console.log('\n✅ Migrasi selesai!');
    await pool.end();
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Migration error:', err);
    process.exit(1);
});
