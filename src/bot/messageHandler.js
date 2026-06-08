const { routeCommand } = require('../commands');
const { getPending, hasPending } = require('../conversations/pendingStore');
const { handleSetReminderFlow } = require('../conversations/setReminder.flow');
const { handleEditReminderFlow } = require('../conversations/editReminder.flow');

function toJid(value) {
    if (!value || typeof value !== 'string') return null;
    return value.includes('@') ? value : `${value}@s.whatsapp.net`;
}

function uniqueJids(jids) {
    return [...new Set(jids.map(toJid).filter(Boolean))];
}

/**
 * Buat adapter msg agar kompatibel dengan format whatsapp-web.js
 * Sehingga commands dan flows tidak perlu diubah
 */
function createMsgAdapter(sock, rawMsg) {
    const jid = rawMsg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    const chatIds = uniqueJids([
        rawMsg.key.senderPn,
        rawMsg.senderPn,
        rawMsg.key.participantPn,
        rawMsg.key.remoteJidAlt,
        rawMsg.remoteJidAlt,
        jid,
    ]);

    const phoneJid = chatIds.find((candidate) => candidate.endsWith('@s.whatsapp.net'));
    const fromJid = phoneJid || chatIds[0] || jid;

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

    const resolveJid = async (targetJid) => {
        if (!sock.onWhatsApp) {
            return { jid: targetJid, aliases: [targetJid] };
        }

        const [result] = await sock.onWhatsApp(targetJid);
        if (!result?.exists) return null;

        const aliases = uniqueJids([result.jid, result.lid, targetJid]);
        const resolvedJid = toJid(result.jid) || aliases[0] || targetJid;

        return { jid: resolvedJid, aliases };
    };

    const getChatIds = async () => {
        const aliases = [...chatIds];

        for (const chatId of chatIds) {
            try {
                const resolved = await resolveJid(chatId);
                if (resolved?.aliases) {
                    aliases.push(...resolved.aliases);
                }
            } catch (err) {
                console.warn(`Gagal resolve JID ${chatId}:`, err.message);
            }
        }

        return uniqueJids(aliases);
    };

    return {
        body,
        from: fromJid,
        chatIds,
        getChatIds,
        _jid: jid,
        _isGroup: isGroup,
        _rawMsg: rawMsg,
        resolveJid,
        getChat: async () => ({ isGroup }),
        reply: async (text) => {
            await sock.sendMessage(jid, { text }, { quoted: rawMsg });
        },
        sendMessage: async (targetJid, text) => {
            await sock.sendMessage(targetJid, { text });
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

                    if (pending.type === 'SET' || pending.type === 'SET_TO') {
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
