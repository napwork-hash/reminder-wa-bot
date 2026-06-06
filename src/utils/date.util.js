const { nowJakarta } = require('../config/timezone');
const { DAY_TO_ISO_WEEKDAY } = require('../constants/days');

/**
 * Cek apakah hari ini (WIB) ada di list hari reminder
 * @param {string|null} days - Comma-separated "1,3,5" atau null (daily)
 * @returns {boolean}
 */
function isTodayMatchingDay(days) {
    // Daily reminder - selalu match
    if (!days) return true;

    const today = nowJakarta().weekday; // luxon: 1=Monday ... 7=Sunday

    return days
        .split(',')
        .map((d) => DAY_TO_ISO_WEEKDAY[parseInt(d.trim(), 10)])
        .includes(today);
}

/**
 * Cek apakah waktu sekarang (WIB) sudah melewati waktu reminder
 * @param {string} timeStr - Format "HH:mm" (sudah normalized dari DB)
 * @returns {boolean}
 */
function isTimeToTrigger(timeStr) {
    const now = nowJakarta();
    const [hours, minutes] = timeStr.split(':').map(Number);

    const nowMinutes = now.hour * 60 + now.minute;
    const reminderMinutes = hours * 60 + minutes;

    // Trigger jika waktu sekarang >= waktu reminder
    // Tapi beri window 1 menit supaya tidak miss (scheduler jalan per 30 detik)
    return nowMinutes >= reminderMinutes && nowMinutes <= reminderMinutes + 1;
}

/**
 * Ambil tanggal hari ini (WIB) sebagai string YYYY-MM-DD
 * Dipakai untuk last_triggered
 * @returns {string}
 */
function getTodayDateStr() {
    return nowJakarta().toFormat('yyyy-MM-dd');
}

/**
 * Normalize waktu dari format input user (HH.mm) ke format DB (HH:mm)
 * @param {string} timeStr - "11.30"
 * @returns {string} - "11:30"
 */
function normalizeTime(timeStr) {
    return timeStr.replace('.', ':');
}

module.exports = { isTodayMatchingDay, isTimeToTrigger, getTodayDateStr, normalizeTime };
