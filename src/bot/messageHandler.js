const { routeCommand } = require('../commands');
const { getPending, hasPending } = require('../conversations/pendingStore');
const { handleSetReminderFlow } = require('../conversations/setReminder.flow');
const { handleEditReminderFlow } = require('../conversations/editReminder.flow');

/**
 * Buat adapter msg agar kompatibel dengan format whatsapp-web.js
 * Sehingga commands dan flows tidak perlu diubah
 */
function createMsgAdapter(sock, rawMsg) {
    const jid = rawMsg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    // Ambil teks dari berbagai tipe pesan
    const messageContent = rawMsg.message;
    let body = '';
    if (messageContent) {
        body =
            messageContent.conversation ||
            messageContent.extendedTextMessage?.text ||
            messageContent.imageMessage?.caption ||
            messageContent.videoMessage?.caption ||
            '';
    }

    return {
        body,
        from: jid,
        _isGroup: isGroup,
        _rawMsg: rawMsg,
        getChat: async () => ({ isGroup }),
        reply: async (text) => {
            await sock.sendMessage(jid, { text }, { quoted: rawMsg });
        },
    };
}

/**
 * Register message handler
 * @param {object} sock - Baileys socket
 */
function registerMessageHandler(sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // Hanya proses pesan baru (bukan history sync)
        if (type !== 'notify') return;

        for (const rawMsg of messages) {
            try {
                // Ignore pesan dari bot sendiri
                if (rawMsg.key.fromMe) continue;

                const msg = createMsgAdapter(sock, rawMsg);

                // Ignore pesan dari group (hanya private chat)
                if (msg._isGroup) continue;

                // Ignore pesan kosong
                if (!msg.body || !msg.body.trim()) continue;

                const chatId = msg.from;

                // Cek apakah ada pending conversation untuk user ini
                if (hasPending(chatId)) {
                    const pending = getPending(chatId);

                    if (pending.type === 'SET') {
                        const handled = await handleSetReminderFlow(msg, pending);
                        if (handled) continue;
                    }

                    if (pending.type === 'EDIT') {
                        const handled = await handleEditReminderFlow(msg, pending);
                        if (handled) continue;
                    }
                }

                // Route ke command handler
                const isCommand = await routeCommand(msg);
                if (isCommand) continue;

                // Pesan bukan command, ignore (tidak reply apa-apa)
            } catch (err) {
                console.error('❌ Error handle message:', err);
            }
        }
    });
}

module.exports = { registerMessageHandler };
