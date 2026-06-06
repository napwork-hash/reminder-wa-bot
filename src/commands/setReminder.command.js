const { parseSetReminder } = require('../utils/parser.util');
const { isValidTime } = require('../utils/validator.util');
const { startSetReminderFlow } = require('../conversations/setReminder.flow');

/**
 * Handle /setReminder [notes] [HH.mm]
 */
async function handleSetReminder(msg) {
    const parsed = parseSetReminder(msg.body);

    if (!parsed) {
        await msg.reply(
            '❌ Format salah.\n\n' +
            'Gunakan: */setReminder [notes] [HH.mm]*\n' +
            'Contoh: */setReminder minum obat 11.30*'
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

    await startSetReminderFlow(msg, parsed.notes, parsed.time);
}

module.exports = handleSetReminder;
