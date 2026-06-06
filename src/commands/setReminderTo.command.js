const { parseSetReminderTo, parsePhoneToJid } = require('../utils/parser.util');
const { isValidTime } = require('../utils/validator.util');
const { startSetReminderToFlow } = require('../conversations/setReminder.flow');

/**
 * Handle /setReminderTo [nomor] [notes] [HH.mm]
 */
async function handleSetReminderTo(msg) {
    const parsed = parseSetReminderTo(msg.body);

    if (!parsed) {
        await msg.reply(
            '❌ Format salah.\n\n' +
            'Gunakan: */setReminderTo [nomor] [notes] [HH.mm]*\n' +
            'Contoh: */setReminderTo 08123456789 minum obat 11.30*'
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

    const targetJid = parsePhoneToJid(parsed.targetNumber);
    if (!targetJid) {
        await msg.reply(
            '❌ Format nomor HP tujuan tidak valid.\n\n' +
            'Gunakan nomor HP aktif (contoh: *08123456789* atau *628123456789*).'
        );
        return;
    }

    await startSetReminderToFlow(msg, targetJid, parsed.notes, parsed.time);
}

module.exports = handleSetReminderTo;
