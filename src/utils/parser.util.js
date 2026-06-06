const COMMANDS = require('../constants/commands');

/**
 * Parse /setReminder [notes] [HH.mm]
 * Contoh: "/setReminder minum obat 11.30"
 * @returns {{ notes: string, time: string } | null}
 */
function parseSetReminder(body) {
    const prefix = COMMANDS.SET_REMINDER;
    if (!body.startsWith(prefix)) return null;

    const args = body.slice(prefix.length).trim();
    if (!args) return null;

    // Waktu ada di token terakhir (format HH.mm)
    const tokens = args.split(/\s+/);
    if (tokens.length < 2) return null;

    const time = tokens[tokens.length - 1];
    const notes = tokens.slice(0, -1).join(' ');

    if (!notes || !time) return null;

    return { notes, time };
}

/**
 * Parse /editReminder [nomor] [notes] [HH.mm]
 * Contoh: "/editReminder 2 makan siang 12.00"
 * @returns {{ number: number, notes: string, time: string } | null}
 */
function parseEditReminder(body) {
    const prefix = COMMANDS.EDIT_REMINDER;
    if (!body.startsWith(prefix)) return null;

    const args = body.slice(prefix.length).trim();
    if (!args) return null;

    const tokens = args.split(/\s+/);
    if (tokens.length < 3) return null;

    const number = parseInt(tokens[0], 10);
    if (isNaN(number) || number < 1) return null;

    const time = tokens[tokens.length - 1];
    const notes = tokens.slice(1, -1).join(' ');

    if (!notes || !time) return null;

    return { number, notes, time };
}

/**
 * Parse /deleteReminder [nomor]
 * Contoh: "/deleteReminder 2"
 * @returns {{ number: number } | null}
 */
function parseDeleteReminder(body) {
    const prefix = COMMANDS.DELETE_REMINDER;
    if (!body.startsWith(prefix)) return null;

    const args = body.slice(prefix.length).trim();
    if (!args) return null;

    const number = parseInt(args, 10);
    if (isNaN(number) || number < 1) return null;

    return { number };
}

module.exports = { parseSetReminder, parseEditReminder, parseDeleteReminder };
