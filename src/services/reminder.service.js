const reminderRepo = require('../repositories/reminder.repository');

/**
 * Buat reminder baru
 */
async function createReminder(chatId, notes, time, scheduleType, days, createdBy = null) {
    const id = await reminderRepo.create(chatId, notes, time, scheduleType, days, createdBy);
    return id;
}

/**
 * Ambil semua reminder aktif untuk user, dengan nomor urut (1-based)
 */
async function getUserReminders(chatId) {
    const reminders = await reminderRepo.findByChatId(chatId);
    return reminders;
}

/**
 * Ambil reminder berdasarkan nomor urut (bukan DB ID)
 * Nomor urut = posisi di list sorted by time ASC
 */
async function getUserReminderByNumber(chatId, number) {
    const reminders = await reminderRepo.findByChatId(chatId);

    if (number < 1 || number > reminders.length) {
        return null;
    }

    return reminders[number - 1];
}

/**
 * Update reminder berdasarkan nomor urut user
 */
async function updateReminder(chatId, number, notes, time, scheduleType, days) {
    const reminder = await getUserReminderByNumber(chatId, number);
    if (!reminder) return false;

    await reminderRepo.update(reminder.id, notes, time, scheduleType, days);
    return true;
}

/**
 * Delete reminder berdasarkan nomor urut user
 */
async function deleteReminder(chatId, number) {
    const reminder = await getUserReminderByNumber(chatId, number);
    if (!reminder) return false;

    await reminderRepo.remove(reminder.id);
    return true;
}

module.exports = {
    createReminder,
    getUserReminders,
    getUserReminderByNumber,
    updateReminder,
    deleteReminder,
};
