const cron = require('node-cron');
const reminderRepo = require('../repositories/reminder.repository');
const { isMatchingDay, getTodayDateStr } = require('../utils/date.util');
const { nowJakarta } = require('../config/timezone');

// In-memory cache untuk reminder aktif
let reminderCache = [];
let activeSock = null;
let refreshTask = null;
let intervalId = null;
let isTickRunning = false;

// Track notifikasi yang sudah dikirim: { "date-reminderId-phase": true }
// phase: "before" (T-5min), "ontime" (T), "after" (T+5min)
const sentToday = new Map();

/**
 * Hapus tracker lama saat ganti hari, tanpa menghapus key kemarin/hari ini/besok.
 * Fase reminder bisa menyeberang tengah malam.
 */
let lastResetDate = getTodayDateStr();
function resetSentTrackerIfNewDay() {
    const today = getTodayDateStr();
    if (today !== lastResetDate) {
        const now = nowJakarta();
        const validDates = new Set([
            now.minus({ days: 1 }).toFormat('yyyy-MM-dd'),
            now.toFormat('yyyy-MM-dd'),
            now.plus({ days: 1 }).toFormat('yyyy-MM-dd'),
        ]);

        for (const key of sentToday.keys()) {
            const date = key.slice(0, 10);
            if (!validDates.has(date)) {
                sentToday.delete(key);
            }
        }

        lastResetDate = today;
    }
}

/**
 * Load semua reminder aktif dari DB ke memory cache.
 */
async function refreshCache() {
    try {
        reminderCache = await reminderRepo.findAllActive();
        console.log(`Cache refreshed: ${reminderCache.length} reminder aktif`);
    } catch (err) {
        console.error('Gagal refresh cache:', err.message);
    }
}

/**
 * Ambil cache (dipakai oleh command create/edit/delete untuk invalidate).
 */
function getCache() {
    return reminderCache;
}

/**
 * Cek apakah waktu sekarang cocok dengan target dalam window 1 menit.
 * @param {number} targetMinutes - target dalam total menit (jam*60 + menit)
 * @returns {boolean}
 */
function isInTimeWindow(targetMinutes) {
    const now = nowJakarta();
    const nowMinutes = now.hour * 60 + now.minute;
    const adjusted = ((targetMinutes % 1440) + 1440) % 1440;
    const diff = (nowMinutes - adjusted + 1440) % 1440;

    return diff >= 0 && diff <= 1;
}

/**
 * Ambil tanggal reminder asal untuk sebuah fase notifikasi.
 * Contoh: reminder Senin 00:03 fase before dikirim Minggu 23:58,
 * tapi hari yang harus dicek tetap Senin.
 */
function getReminderDateForPhase(reminderMinutes, phaseOffset) {
    const now = nowJakarta();
    const targetMinutes = reminderMinutes + phaseOffset;

    if (targetMinutes < 0) {
        return now.plus({ days: 1 });
    }

    if (targetMinutes >= 1440) {
        return now.minus({ days: 1 });
    }

    return now;
}

/**
 * Start scheduler: cronjob 12 jam + interval 30 detik.
 * Scheduler dibuat singleton; saat reconnect hanya socket aktif yang diganti.
 * @param {object} sock - Baileys socket
 */
async function startScheduler(sock) {
    activeSock = sock;

    if (intervalId) {
        await refreshCache();
        console.log('Scheduler sudah berjalan, socket aktif diperbarui');
        return;
    }

    await refreshCache();

    refreshTask = cron.schedule('0 */12 * * *', async () => {
        console.log('Cronjob 12 jam: refreshing cache dari database...');
        await refreshCache();
    });

    const phases = [
        { key: 'before', offset: -5, label: '*REMINDER (5 menit lagi!)*' },
        { key: 'ontime', offset: 0, label: '*REMINDER! Waktunya sekarang!*' },
        { key: 'after', offset: 5, label: '*REMINDER (sudah 5 menit lalu)*' },
    ];

    intervalId = setInterval(async () => {
        if (isTickRunning) return;
        isTickRunning = true;

        resetSentTrackerIfNewDay();

        try {
            for (const reminder of reminderCache) {
                const [hours, minutes] = reminder.time.split(':').map(Number);
                const reminderMinutes = hours * 60 + minutes;

                for (const phase of phases) {
                    try {
                        const targetMinutes = reminderMinutes + phase.offset;
                        const reminderDate = getReminderDateForPhase(reminderMinutes, phase.offset);

                        if (!isMatchingDay(reminder.days, reminderDate)) continue;
                        if (!isInTimeWindow(targetMinutes)) continue;

                        const sentKey = `${reminderDate.toFormat('yyyy-MM-dd')}-${reminder.id}-${phase.key}`;
                        if (sentToday.has(sentKey)) continue;

                        const message =
                            `${phase.label}\n\n` +
                            `${reminder.notes}\n` +
                            `${reminder.time} WIB`;

                        await activeSock.sendMessage(reminder.chat_id, { text: message });
                        sentToday.set(sentKey, true);
                        console.log(`[${phase.key}] Reminder terkirim ke ${reminder.chat_id}: ${reminder.notes}`);

                        if (phase.key === 'ontime') {
                            const reminderDateStr = reminderDate.toFormat('yyyy-MM-dd');
                            await reminderRepo.updateLastTriggered(reminder.id, reminderDateStr);
                            reminder.last_triggered = reminderDateStr;
                        }
                    } catch (err) {
                        console.error(`Gagal kirim reminder ID ${reminder.id}:`, err.message);
                    }
                }
            }
        } finally {
            isTickRunning = false;
        }
    }, 30000);

    console.log('Scheduler dimulai (interval 30s + cronjob 12h)');
}

function stopScheduler() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    if (refreshTask) {
        refreshTask.stop();
        refreshTask = null;
    }

    activeSock = null;
    isTickRunning = false;
}

module.exports = { startScheduler, stopScheduler, refreshCache, getCache };
