const { setPending, clearPending } = require('./pendingStore');
const { isValidDays } = require('../utils/validator.util');
const { formatDays, formatTime } = require('../utils/formatter.util');
const { normalizeTime } = require('../utils/date.util');
const reminderService = require('../services/reminder.service');
const { refreshCache } = require('../services/scheduler.service');
const { formatJidToPhone } = require('../utils/parser.util');

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
 * Mulai flow setReminderTo (untuk nomor tertentu)
 */
async function startSetReminderToFlow(msg, targetJid, notes, time) {
    const chatId = msg.from;
    const normalizedTime = normalizeTime(time);

    setPending(chatId, {
        step: 'AWAITING_SCHEDULE',
        type: 'SET_TO',
        data: { targetJid, notes, time: normalizedTime },
    });

    const targetPhone = formatJidToPhone(targetJid);
    const reply =
        `✅ *Reminder dibuat untuk ${targetPhone}:*\n` +
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
            const isSetTo = pending.type === 'SET_TO';
            const targetJid = isSetTo ? pending.data.targetJid : chatId;
            const createdBy = isSetTo ? chatId : null;

            await reminderService.createReminder(
                targetJid,
                pending.data.notes,
                pending.data.time,
                'daily',
                null,
                createdBy
            );

            clearPending(chatId);
            await refreshCache();

            const scheduleDesc = 'Setiap hari';
            if (isSetTo) {
                const targetPhone = formatJidToPhone(targetJid);
                await msg.reply(
                    `✅ *Reminder tersimpan!*\n\n` +
                    `📝 ${pending.data.notes}\n` +
                    `⏰ ${pending.data.time} WIB\n` +
                    `📅 ${scheduleDesc}\n` +
                    `🎯 Tujuan: ${targetPhone}`
                );

                // Kirim notif ke target
                const creatorPhone = formatJidToPhone(chatId);
                await msg.sendMessage(
                    targetJid,
                    `⏰ *Reminder di-set oleh ${creatorPhone}*\n` +
                    `📝 ${pending.data.notes}\n` +
                    `⏰ ${pending.data.time} WIB (${scheduleDesc})\n\n` +
                    `Silahkan lihat di /list`
                );
            } else {
                await msg.reply(
                    `✅ *Reminder tersimpan!*\n\n` +
                    `📝 ${pending.data.notes}\n` +
                    `⏰ ${pending.data.time} WIB\n` +
                    `📅 ${scheduleDesc}`
                );
            }
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

        const isSetTo = pending.type === 'SET_TO';
        const targetJid = isSetTo ? pending.data.targetJid : chatId;
        const createdBy = isSetTo ? chatId : null;

        await reminderService.createReminder(
            targetJid,
            pending.data.notes,
            pending.data.time,
            'specific',
            days,
            createdBy
        );

        clearPending(chatId);
        await refreshCache();

        const scheduleDesc = formatDays(days);
        if (isSetTo) {
            const targetPhone = formatJidToPhone(targetJid);
            await msg.reply(
                `✅ *Reminder tersimpan!*\n\n` +
                `📝 ${pending.data.notes}\n` +
                `⏰ ${pending.data.time} WIB\n` +
                `📅 ${scheduleDesc}\n` +
                `🎯 Tujuan: ${targetPhone}`
            );

            // Kirim notif ke target
            const creatorPhone = formatJidToPhone(chatId);
            await msg.sendMessage(
                targetJid,
                `⏰ *Reminder di-set oleh ${creatorPhone}*\n` +
                `📝 ${pending.data.notes}\n` +
                `⏰ ${pending.data.time} WIB (${scheduleDesc})\n\n` +
                `Silahkan lihat di /list`
            );
        } else {
            await msg.reply(
                `✅ *Reminder tersimpan!*\n\n` +
                `📝 ${pending.data.notes}\n` +
                `⏰ ${pending.data.time} WIB\n` +
                `📅 ${scheduleDesc}`
            );
        }
        return true;
    }

    return false;
}

module.exports = { startSetReminderFlow, startSetReminderToFlow, handleSetReminderFlow };
