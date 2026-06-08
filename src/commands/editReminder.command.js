const { parseEditReminder } = require('../utils/parser.util');
const { isValidTime } = require('../utils/validator.util');
const reminderService = require('../services/reminder.service');
const { startEditReminderFlow } = require('../conversations/editReminder.flow');

/**
 * Handle /editReminder [nomor] [notes] [HH.mm]
 */
async function handleEditReminder(msg) {
    const parsed = parseEditReminder(msg.body);

    if (!parsed) {
        await msg.reply(
            '❌ Format salah.\n\n' +
            'Gunakan: */editReminder [nomor] [notes] [HH.mm]*\n' +
            'Contoh: */editReminder 2 makan siang 12.00*'
        );
        return;
    }

    if (!isValidTime(parsed.time)) {
        await msg.reply(
            '❌ Format waktu salah.\n\n' +
            'Gunakan format *HH.mm* (00.00 - 23.59)\n' +
            'Contoh: *11.30*, *09.00*, *21.45*'
        );
        return;
    }

    // Cek apakah nomor valid
    const chatIds = msg.getChatIds ? await msg.getChatIds() : (msg.chatIds || [msg.from]);
    const reminder = await reminderService.getUserReminderByNumber(chatIds, parsed.number);

    if (!reminder) {
        await msg.reply(`❌ Reminder #${parsed.number} tidak ditemukan.\n\nGunakan */list* untuk melihat daftar reminder.`);
        return;
    }

    await startEditReminderFlow(msg, parsed.number, parsed.notes, parsed.time);
}

module.exports = handleEditReminder;
