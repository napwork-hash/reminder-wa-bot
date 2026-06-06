# FLOW

/setReminder [notes] [waktu]

Contoh:
/setReminder minum obat 11.30

Bot jawab:

Reminder dibuat:
Notes: minum obat
Jam: 11:30 WIB

Pilih jadwal:

1. Setiap hari
2. Hari tertentu saja

Balas: 1 atau 2

Kalau user balas 1, reminder aktif setiap hari.

Kalau user balas 2, bot lanjut tanya:

Pilih hari:

1. Senin
2. Selasa
3. Rabu
4. Kamis
5. Jumat
6. Sabtu
7. Minggu

Contoh balasan:
1,3,5

Artinya reminder hanya Senin, Rabu, Jumat.

Command list
/setReminder [notes] [HH.mm]
/list
/editReminder [nomor] [notes] [HH.mm]
/deleteReminder [nomor]

Lebih konsisten kalau command delete pakai:

/deleteReminder [nomor]

Contoh:

/deleteReminder 2

Mapping hari:

1 = Senin
2 = Selasa
3 = Rabu
4 = Kamis
5 = Jumat
6 = Sabtu
7 = Minggu
