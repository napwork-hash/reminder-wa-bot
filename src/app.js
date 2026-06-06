require('dotenv').config();

const { testConnection, runMigration } = require('./config/database');
const { createClient } = require('./bot/client');
const { registerConnectionHandler } = require('./bot/qrHandler');
const { registerMessageHandler } = require('./bot/messageHandler');
const { startScheduler } = require('./services/scheduler.service');
const { DisconnectReason } = require('@whiskeysockets/baileys');

async function main() {
    console.log('🚀 WhatsApp Reminder Bot starting...\n');

    // 1. Test koneksi database
    await testConnection();

    // 2. Jalankan migrasi (buat tabel jika belum ada)
    await runMigration();

    // 3. Buat WhatsApp client (Baileys + MySQL auth state)
    const startBot = async () => {
        const { sock, saveCreds } = await createClient();

        // 4. Register event handlers
        registerConnectionHandler(sock, saveCreds, async () => {
            // Callback saat connected - start scheduler
            await startScheduler(sock);

            console.log('\n🤖 Bot siap menerima perintah!');
            console.log('📝 Ketik /help di WhatsApp untuk melihat daftar perintah.\n');
        });

        registerMessageHandler(sock);

        // 5. Handle disconnect & auto-reconnect
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    console.log('🔄 Mencoba reconnect...');
                    await startBot(); // Reconnect
                } else {
                    console.log('🚪 Bot logged out. Jalankan ulang untuk scan QR baru.');
                    process.exit(0);
                }
            }
        });
    };

    await startBot();
}

main().catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
