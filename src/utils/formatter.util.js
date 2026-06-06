const { DAY_NAMES } = require('../constants/days');

/**
 * Format list reminder jadi numbered list
 * @param {Array} reminders - Array of reminder objects
 * @returns {string}
 */
function formatReminderList(reminders) {
    if (!reminders || reminders.length === 0) {
        return '📭 Belum ada reminder aktif.';
    }

    const lines = reminders.map((r, i) => {
        const num = i + 1;
        const time = formatTime(r.time);
        const schedule =
            r.schedule_type === 'daily'
                ? 'Setiap hari'
                : `${formatDays(r.days)}`;

        return `${num}. 📝 ${r.notes}\n   ⏰ ${time}\n   📅 ${schedule}`;
    });

    return `📋 *Daftar Reminder:*\n\n${lines.join('\n\n')}`;
}

/**
 * Format days string jadi nama hari
 * "1,3,5" -> "Senin, Rabu, Jumat"
 * @param {string} daysStr
 * @returns {string}
 */
function formatDays(daysStr) {
    if (!daysStr) return 'Setiap hari';

    return daysStr
        .split(',')
        .map((d) => DAY_NAMES[parseInt(d.trim(), 10)])
        .filter(Boolean)
        .join(', ');
}

/**
 * Format time string
 * "11.30" -> "11:30 WIB"
 * "09.05" -> "09:05 WIB"
 * @param {string} timeStr - Format "HH.mm" atau "HH:mm"
 * @returns {string}
 */
function formatTime(timeStr) {
    // Support both "11.30" and "11:30"
    const normalized = timeStr.replace('.', ':');
    return `${normalized} WIB`;
}

module.exports = { formatReminderList, formatDays, formatTime };
