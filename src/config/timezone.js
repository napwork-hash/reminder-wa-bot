const { DateTime } = require('luxon');

const TIMEZONE = 'Asia/Jakarta';

/**
 * Ambil waktu sekarang di timezone Jakarta (WIB)
 * @returns {DateTime}
 */
function nowJakarta() {
    return DateTime.now().setZone(TIMEZONE);
}

module.exports = { TIMEZONE, nowJakarta };
