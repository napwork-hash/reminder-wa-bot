/**
 * Mapping nomor ke nama hari (Bahasa Indonesia)
 * Sesuai ISO weekday: 1=Senin ... 7=Minggu
 */
const DAY_NAMES = {
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
    7: 'Minggu',
};

/**
 * Mapping nomor input user ke ISO weekday luxon
 * Kebetulan sama (1=Monday=Senin ... 7=Sunday=Minggu)
 */
const DAY_TO_ISO_WEEKDAY = {
    1: 1, // Senin  -> Monday
    2: 2, // Selasa -> Tuesday
    3: 3, // Rabu   -> Wednesday
    4: 4, // Kamis  -> Thursday
    5: 5, // Jumat  -> Friday
    6: 6, // Sabtu  -> Saturday
    7: 7, // Minggu -> Sunday
};

module.exports = { DAY_NAMES, DAY_TO_ISO_WEEKDAY };
