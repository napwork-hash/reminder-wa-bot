const reminderService = require('../services/reminder.service');
const { formatReminderList } = require('../utils/formatter.util');

/**
 * Handle /list
 */
async function handleList(msg) {
    const chatId = msg.from;
    const reminders = await reminderService.getUserReminders(chatId);
    const formatted = formatReminderList(reminders);
    await msg.reply(formatted);
}

module.exports = handleList;
