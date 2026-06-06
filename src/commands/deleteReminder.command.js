const { parseDeleteReminder } = require('../utils/parser.util');
const reminderService = require('../services/reminder.service');
const { refreshCache } = require('../services/scheduler.service');

/**
 * Handle /deleteReminder [nomor]
 */
async function handleDeleteReminder(msg) {
    const parsed = parseDeleteReminder(msg.body);

    if (!parsed) {
        await msg.reply(
            '❌ Format salah.\n\n' +
            'Gunakan: */deleteReminder [nomor]*\n' +
            'Contoh: */deleteReminder 2*'
        );
        return;
    }

    const chatId = msg.from;

    // Ambil detail reminder sebelum dihapus untuk konfirmasi
    const reminder = await reminderService.getUserReminderByNumber(chatId, parsed.number);

    if (!reminder) {
        await msg.reply(`❌ Reminder #${parsed.number} tidak ditemukan.\n\nGunakan */list* untuk melihat daftar reminder.`);
        return;
    }

    const success = await reminderService.deleteReminder(chatId, parsed.number);

    if (success) {
        await refreshCache();
        await msg.reply(
            `🗑️ *Reminder #${parsed.number} dihapus!*\n\n` +
            `📝 ${reminder.notes}\n` +
            `⏰ ${reminder.time} WIB`
        );
    } else {
        await msg.reply('❌ Gagal menghapus reminder.');
    }
}

module.exports = handleDeleteReminder;
