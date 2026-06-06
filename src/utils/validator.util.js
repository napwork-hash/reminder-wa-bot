/**
 * Validasi format waktu HH.mm (00.00 - 23.59)
 * @param {string} timeStr - Format "HH.mm" contoh "11.30"
 * @returns {boolean}
 */
function isValidTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return false;

    const match = timeStr.match(/^(\d{1,2})\.(\d{2})$/);
    if (!match) return false;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Validasi input hari (comma-separated, angka 1-7)
 * Contoh valid: "1", "1,3,5", "1,2,3,4,5,6,7"
 * @param {string} daysStr
 * @returns {boolean}
 */
function isValidDays(daysStr) {
    if (!daysStr || typeof daysStr !== 'string') return false;

    const parts = daysStr.split(',').map((s) => s.trim());

    if (parts.length === 0) return false;

    return parts.every((part) => {
        const num = parseInt(part, 10);
        return !isNaN(num) && num >= 1 && num <= 7;
    });
}

module.exports = { isValidTime, isValidDays };
