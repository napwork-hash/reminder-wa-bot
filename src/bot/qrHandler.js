const qrcode = require('qrcode-terminal');
const { DisconnectReason } = require('@whiskeysockets/baileys');

/**
 * Register connection event handlers (QR, auth, reconnect)
 * @param {object} sock - Baileys socket
 * @param {Function} saveCreds - Fungsi untuk save credentials
 * @param {Function} onReady - Callback saat connected
 */
function registerConnectionHandler(sock, saveCreds, onReady) {
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR code untuk scan
        if (qr) {
            console.log('\n📱 Scan QR code berikut dengan WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        // Connected
        if (connection === 'open') {
            console.log('✅ WhatsApp client ready!\n');
            if (onReady) onReady();
        }

        // Disconnected
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log('⚠️ Koneksi terputus, mencoba reconnect...');
            } else {
                console.log('❌ Logged out. Hapus session dan scan QR ulang.');
            }
        }
    });
}

module.exports = { registerConnectionHandler };
