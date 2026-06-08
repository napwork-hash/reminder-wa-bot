const { pool } = require('../config/database');

/**
 * Insert reminder baru
 */
async function create(chatId, notes, time, scheduleType, days, createdBy = null) {
    const [result] = await pool.execute(
        `INSERT INTO reminders (chat_id, notes, time, schedule_type, days, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [chatId, notes, time, scheduleType, days || null, createdBy]
    );
    return result.insertId;
}

/**
 * Ambil semua reminder aktif untuk user tertentu
 */
async function findByChatId(chatId) {
    const chatIds = Array.isArray(chatId)
        ? [...new Set(chatId.filter(Boolean))]
        : [chatId];

    if (chatIds.length === 0) return [];

    if (chatIds.length > 1) {
        const placeholders = chatIds.map(() => '?').join(', ');
        const [rows] = await pool.execute(
            `SELECT * FROM reminders WHERE chat_id IN (${placeholders}) AND is_active = 1 ORDER BY time ASC`,
            chatIds
        );
        return rows;
    }

    const [rows] = await pool.execute(
        `SELECT * FROM reminders WHERE chat_id = ? AND is_active = 1 ORDER BY time ASC`,
        [chatIds[0]]
    );
    return rows;
}

/**
 * Ambil satu reminder berdasarkan ID
 */
async function findById(id) {
    const [rows] = await pool.execute(
        `SELECT * FROM reminders WHERE id = ?`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Update reminder
 */
async function update(id, notes, time, scheduleType, days) {
    await pool.execute(
        `UPDATE reminders SET notes = ?, time = ?, schedule_type = ?, days = ?
         WHERE id = ?`,
        [notes, time, scheduleType, days || null, id]
    );
}

/**
 * Hapus reminder (hard delete)
 */
async function remove(id) {
    await pool.execute(`DELETE FROM reminders WHERE id = ?`, [id]);
}

/**
 * Ambil semua reminder aktif (untuk scheduler)
 */
async function findAllActive() {
    const [rows] = await pool.execute(
        `SELECT * FROM reminders WHERE is_active = 1 ORDER BY time ASC`
    );
    return rows;
}

/**
 * Update last_triggered date
 */
async function updateLastTriggered(id, dateStr) {
    await pool.execute(
        `UPDATE reminders SET last_triggered = ? WHERE id = ?`,
        [dateStr, id]
    );
}

module.exports = {
    create,
    findByChatId,
    findById,
    update,
    remove,
    findAllActive,
    updateLastTriggered,
};
