/**
 * Handle /help
 */
async function handleHelp(msg) {
    const helpText =
        `🤖 *WhatsApp Reminder Bot*\n\n` +
        `Daftar perintah:\n\n` +
        `📌 */setReminder [notes] [HH.mm]*\n` +
        `   Buat reminder baru\n` +
        `   Contoh: /setReminder minum obat 11.30\n\n` +
        `👥 */setReminderTo [nomor] [notes] [HH.mm]*\n` +
        `   Buat reminder baru untuk nomor orang lain\n` +
        `   Contoh: /setReminderTo 08123456789 minum obat 11.30\n\n` +
        `📋 */list*\n` +
        `   Lihat semua reminder aktif\n\n` +
        `✏️ */editReminder [nomor] [notes] [HH.mm]*\n` +
        `   Edit reminder yang sudah ada\n` +
        `   Contoh: /editReminder 2 makan siang 12.00\n\n` +
        `🗑️ */deleteReminder [nomor]*\n` +
        `   Hapus reminder\n` +
        `   Contoh: /deleteReminder 2\n\n` +
        `❓ */help*\n` +
        `   Tampilkan pesan ini\n\n` +
        `⏰ Timezone: WIB (Asia/Jakarta)`;

    await msg.reply(helpText);
}

module.exports = handleHelp;
