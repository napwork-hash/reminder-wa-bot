const { setPending, clearPending } = require('./pendingStore');
const { isValidDays } = require('../utils/validator.util');
const { formatDays, formatTime } = require('../utils/formatter.util');
const { normalizeTime } = require('../utils/date.util');
const reminderService = require('../services/reminder.service');
const { refreshCache } = require('../services/scheduler.service');

/**
 * Mulai flow setReminder: simpan pending state dan tanya jadwal
 */
async function startSetReminderFlow(msg, notes, time) {
    const chatId = msg.from;
    const normalizedTime = normalizeTime(time);

    setPending(chatId, {
        step: 'AWAITING_SCHEDULE',
        type: 'SET',
        data: { notes, time: normalizedTime },
    });

    const reply =
        `✅ *Reminder dibuat:*\n` +
        `📝 Notes: ${notes}\n` +
        `⏰ Jam: ${formatTime(time)}\n\n` +
        `Pilih jadwal:\n` +
        `1. Setiap hari\n` +
        `2. Hari tertentu saja\n\n` +
        `Balas: *1* atau *2*`;

    await msg.reply(reply);
}

/**
 * Handle balasan user untuk flow setReminder
 * @returns {boolean} true jika pesan dihandle, false jika bukan bagian dari flow
 */
async function handleSetReminderFlow(msg, pending) {
    const chatId = msg.from;
    const body = msg.body.trim();

    if (pending.step === 'AWAITING_SCHEDULE') {
        if (body === '1') {
            // Setiap hari
            await reminderService.createReminder(
                chatId,
                pending.data.notes,
                pending.data.time,
                'daily',
                null
            );

            clearPending(chatId);
            await refreshCache();

            await msg.reply(
                `✅ *Reminder tersimpan!*\n\n` +
                `📝 ${pending.data.notes}\n` +
                `⏰ ${pending.data.time} WIB\n` +
                `📅 Setiap hari`
            );
            return true;
        }

        if (body === '2') {
            // Hari tertentu - lanjut tanya
            setPending(chatId, {
                ...pending,
                step: 'AWAITING_DAYS',
            });

            await msg.reply(
                `Pilih hari (boleh lebih dari satu):\n\n` +
                `1. Senin\n` +
                `2. Selasa\n` +
                `3. Rabu\n` +
                `4. Kamis\n` +
                `5. Jumat\n` +
                `6. Sabtu\n` +
                `7. Minggu\n\n` +
                `Contoh balasan: *1,3,5*`
            );
            return true;
        }

        // Input tidak valid
        await msg.reply('❌ Pilihan tidak valid. Balas *1* (setiap hari) atau *2* (hari tertentu).');
        return true;
    }

    if (pending.step === 'AWAITING_DAYS') {
        if (!isValidDays(body)) {
            await msg.reply('❌ Format tidak valid. Balas dengan angka 1-7, pisahkan dengan koma.\nContoh: *1,3,5*');
            return true;
        }

        // Normalize: sort dan deduplicate
        const days = [...new Set(body.split(',').map((d) => parseInt(d.trim(), 10)))]
            .sort((a, b) => a - b)
            .join(',');

        await reminderService.createReminder(
            chatId,
            pending.data.notes,
            pending.data.time,
            'specific',
            days
        );

        clearPending(chatId);
        await refreshCache();

        await msg.reply(
            `✅ *Reminder tersimpan!*\n\n` +
            `📝 ${pending.data.notes}\n` +
            `⏰ ${pending.data.time} WIB\n` +
            `📅 ${formatDays(days)}`
        );
        return true;
    }

    return false;
}

module.exports = { startSetReminderFlow, handleSetReminderFlow };
