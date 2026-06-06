const cron = require('node-cron');
const reminderRepo = require('../repositories/reminder.repository');
const { isTodayMatchingDay, getTodayDateStr } = require('../utils/date.util');
const { nowJakarta } = require('../config/timezone');

// In-memory cache untuk reminder aktif
let reminderCache = [];

// Track notifikasi yang sudah dikirim hari ini: { "reminderId-phase": true }
// phase: "before" (T-5min), "ontime" (T), "after" (T+5min)
const sentToday = new Map();

/**
 * Reset sent tracker setiap ganti hari
 */
let lastResetDate = getTodayDateStr();
function resetSentTrackerIfNewDay() {
    const today = getTodayDateStr();
    if (today !== lastResetDate) {
        sentToday.clear();
        lastResetDate = today;
    }
}

/**
 * Load semua reminder aktif dari DB ke memory cache
 */
async function refreshCache() {
    try {
        reminderCache = await reminderRepo.findAllActive();
        console.log(`🔄 Cache refreshed: ${reminderCache.length} reminder aktif`);
    } catch (err) {
        console.error('❌ Gagal refresh cache:', err.message);
    }
}

/**
 * Ambil cache (dipakai oleh command create/edit/delete untuk invalidate)
 */
function getCache() {
    return reminderCache;
}

/**
 * Cek apakah waktu sekarang cocok dengan target (dalam window 1 menit)
 * @param {number} targetMinutes - target dalam total menit (jam*60 + menit)
 * @returns {boolean}
 */
function isInTimeWindow(targetMinutes) {
    const now = nowJakarta();
    const nowMinutes = now.hour * 60 + now.minute;
    // Wrap around midnight: target bisa jadi negatif atau > 1440
    const adjusted = ((targetMinutes % 1440) + 1440) % 1440;
    return nowMinutes >= adjusted && nowMinutes <= adjusted + 1;
}

/**
 * Start scheduler: cronjob 12 jam + interval 30 detik
 * Kirim 3 notifikasi per reminder: T-5 menit, T (tepat waktu), T+5 menit
 * @param {object} sock - Baileys socket
 */
async function startScheduler(sock) {
    // Initial load saat startup
    await refreshCache();

    // Cronjob setiap 12 jam: refresh cache dari DB
    cron.schedule('0 */12 * * *', async () => {
        console.log('⏰ Cronjob 12 jam: refreshing cache dari database...');
        await refreshCache();
    });

    // Definisi 3 fase notifikasi
    const phases = [
        { key: 'before', offset: -5, label: '⏰ *REMINDER (5 menit lagi!)*' },
        { key: 'ontime', offset: 0,  label: '⏰ *REMINDER! Waktunya sekarang!*' },
        { key: 'after',  offset: 5,  label: '⏰ *REMINDER (sudah 5 menit lalu)*' },
    ];

    // Interval setiap 30 detik: cek reminder dari cache
    setInterval(async () => {
        resetSentTrackerIfNewDay();

        for (const reminder of reminderCache) {
            try {
                // Cek apakah hari ini cocok
                if (!isTodayMatchingDay(reminder.days)) {
                    continue;
                }

                // Parse waktu reminder ke total menit
                const [hours, minutes] = reminder.time.split(':').map(Number);
                const reminderMinutes = hours * 60 + minutes;

                for (const phase of phases) {
                    const sentKey = `${reminder.id}-${phase.key}`;

                    // Skip jika fase ini sudah dikirim hari ini
                    if (sentToday.has(sentKey)) continue;

                    // Cek apakah sekarang masuk window waktu fase ini
                    const targetMinutes = reminderMinutes + phase.offset;
                    if (!isInTimeWindow(targetMinutes)) continue;

                    // Kirim pesan reminder
                    const message =
                        `${phase.label}\n\n` +
                        `📝 ${reminder.notes}\n` +
                        `🕐 ${reminder.time} WIB`;

                    await sock.sendMessage(reminder.chat_id, { text: message });
                    sentToday.set(sentKey, true);
                    console.log(`📤 [${phase.key}] Reminder terkirim ke ${reminder.chat_id}: ${reminder.notes}`);

                    // Update last_triggered di DB saat fase "ontime"
                    if (phase.key === 'ontime') {
                        const todayStr = getTodayDateStr();
                        await reminderRepo.updateLastTriggered(reminder.id, todayStr);
                        reminder.last_triggered = todayStr;
                    }
                }
            } catch (err) {
                console.error(`❌ Gagal kirim reminder ID ${reminder.id}:`, err.message);
            }
        }
    }, 30000); // 30 detik

    console.log('✅ Scheduler dimulai (interval 30s + cronjob 12h)');
}

module.exports = { startScheduler, refreshCache, getCache };
