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

/**
 * Parse /setReminderTo [nomor_tujuan] [notes] [waktu]
 * Contoh: "/setReminderTo 08123456789 minum obat 11.30"
 * @returns {{ targetNumber: string, notes: string, time: string } | null}
 */
function parseSetReminderTo(body) {
    const prefix = COMMANDS.SET_REMINDER_TO || '/setReminderTo';
    if (!body.startsWith(prefix)) return null;

    const args = body.slice(prefix.length).trim();
    if (!args) return null;

    const tokens = args.split(/\s+/);
    if (tokens.length < 3) return null; // [nomor] [notes...] [time]

    const targetNumber = tokens[0];
    const time = tokens[tokens.length - 1];
    const notes = tokens.slice(1, -1).join(' ');

    if (!targetNumber || !notes || !time) return null;

    return { targetNumber, notes, time };
}

/**
 * Format nomor HP ke WhatsApp JID.
 * @param {string} phone 
 * @returns {string|null} JID (e.g. "628123456789@s.whatsapp.net") atau null jika invalid
 */
function parsePhoneToJid(phone) {
    if (!phone) return null;
    
    // Bersihkan karakter non-digit
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return null;
    
    // Ubah 0 di depan menjadi 62
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    }
    
    // Jika hanya 8xxxx (misal user ketik 812xxx), tambahkan 62
    if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    
    // Validasi panjang nomor HP
    if (cleaned.length < 9 || cleaned.length > 15) {
        return null;
    }
    
    return `${cleaned}@s.whatsapp.net`;
}

/**
 * Format JID kembali ke nomor HP terbaca (e.g. "628123456789@s.whatsapp.net" -> "08123456789")
 * @param {string} jid
 * @returns {string}
 */
function formatJidToPhone(jid) {
    if (!jid) return '';
    const numberPart = jid.split('@')[0];
    if (numberPart.startsWith('62')) {
        return '0' + numberPart.slice(2);
    }
    return numberPart;
}

module.exports = {
    parseSetReminder,
    parseEditReminder,
    parseDeleteReminder,
    parseSetReminderTo,
    parsePhoneToJid,
    formatJidToPhone
};
