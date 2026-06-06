const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { pool } = require('../config/database');

/**
 * MySQL-based auth state untuk Baileys
 * Menyimpan creds dan keys di tabel baileys_auth
 */
async function useMySQLAuthState() {
    const writeData = async (id, data) => {
        const json = JSON.stringify(data, BufferJSON.replacer);
        await pool.execute(
            `INSERT INTO baileys_auth (id, data) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE data = ?, updated_at = CURRENT_TIMESTAMP`,
            [id, json, json]
        );
    };

    const readData = async (id) => {
        const [rows] = await pool.execute('SELECT data FROM baileys_auth WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        return JSON.parse(rows[0].data, BufferJSON.reviver);
    };

    const removeData = async (id) => {
        await pool.execute('DELETE FROM baileys_auth WHERE id = ?', [id]);
    };

    // Load creds jika ada
    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            const value = await readData(`${type}-${id}`);
                            if (value) {
                                if (type === 'app-state-sync-key') {
                                    data[id] = proto.Message.AppStateSyncKeyData.fromObject(value);
                                } else {
                                    data[id] = value;
                                }
                            }
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const dbId = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(dbId, value));
                            } else {
                                tasks.push(removeData(dbId));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => writeData('creds', creds),
    };
}

// Import Baileys internals untuk serialisasi
const { proto } = require('@whiskeysockets/baileys');
const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

/**
 * Buat Baileys WhatsApp socket
 * @returns {{ sock, saveCreds }}
 */
async function createClient() {
    const { state, saveCreds } = await useMySQLAuthState();
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // Kita handle QR sendiri via qrHandler
        logger: pino({ level: 'silent' }), // Suppress Baileys internal logs
        browser: ['WA-Bot-Reminder', 'Chrome', '1.0.0'],
    });

    return { sock, saveCreds };
}

module.exports = { createClient };
