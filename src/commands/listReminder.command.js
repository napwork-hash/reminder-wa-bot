const reminderService = require('../services/reminder.service');
const { formatReminderList } = require('../utils/formatter.util');

/**
 * Handle /list
 */
async function handleList(msg) {
    const chatIds = msg.getChatIds ? await msg.getChatIds() : (msg.chatIds || [msg.from]);
    const reminders = await reminderService.getUserReminders(chatIds);
    const formatted = formatReminderList(reminders);
    await msg.reply(formatted);
}

module.exports = handleList;
