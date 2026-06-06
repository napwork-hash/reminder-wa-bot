/**
 * In-memory store untuk state conversation yang sedang berlangsung
 * Key: chatId, Value: { step, data }
 *
 * Steps:
 * - AWAITING_SCHEDULE: menunggu user pilih 1 (setiap hari) atau 2 (hari tertentu)
 * - AWAITING_DAYS: menunggu user pilih hari (1,3,5 dsb)
 */
const pendingMap = new Map();

function setPending(chatId, state) {
    pendingMap.set(chatId, state);
}

function getPending(chatId) {
    return pendingMap.get(chatId) || null;
}

function clearPending(chatId) {
    pendingMap.delete(chatId);
}

function hasPending(chatId) {
    return pendingMap.has(chatId);
}

module.exports = { setPending, getPending, clearPending, hasPending };
