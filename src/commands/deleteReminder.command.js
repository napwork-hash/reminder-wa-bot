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

    const chatIds = msg.getChatIds ? await msg.getChatIds() : (msg.chatIds || [msg.from]);

    // Ambil detail reminder sebelum dihapus untuk konfirmasi
    const reminder = await reminderService.getUserReminderByNumber(chatIds, parsed.number);

    if (!reminder) {
        await msg.reply(`❌ Reminder #${parsed.number} tidak ditemukan.\n\nGunakan */list* untuk melihat daftar reminder.`);
        return;
    }

    const success = await reminderService.deleteReminder(chatIds, parsed.number);

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
