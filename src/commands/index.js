const COMMANDS = require('../constants/commands');
const handleSetReminder = require('./setReminder.command');
const handleList = require('./listReminder.command');
const handleEditReminder = require('./editReminder.command');
const handleDeleteReminder = require('./deleteReminder.command');
const handleHelp = require('./help.command');

/**
 * Route command ke handler yang tepat
 * @param {import('whatsapp-web.js').Message} msg
 * @returns {boolean} true jika pesan adalah command yang dihandle
 */
async function routeCommand(msg) {
    const body = msg.body.trim();

    if (body.startsWith(COMMANDS.SET_REMINDER)) {
        await handleSetReminder(msg);
        return true;
    }

    if (body === COMMANDS.LIST) {
        await handleList(msg);
        return true;
    }

    if (body.startsWith(COMMANDS.EDIT_REMINDER)) {
        await handleEditReminder(msg);
        return true;
    }

    if (body.startsWith(COMMANDS.DELETE_REMINDER)) {
        await handleDeleteReminder(msg);
        return true;
    }

    if (body === COMMANDS.HELP) {
        await handleHelp(msg);
        return true;
    }

    return false;
}

module.exports = { routeCommand };
