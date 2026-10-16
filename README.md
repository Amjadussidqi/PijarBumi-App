# PijarBumi

PijarBumi adalah demo aplikasi pemantauan energi rumah berbasis HTML, Tailwind CSS CDN, dan JavaScript. Data disimpan di `localStorage` browser; tidak ada server atau sinkronisasi antarperangkat.

## Menjalankan aplikasi

1. Buka folder proyek di VS Code.
2. Jalankan `index.html` menggunakan Live Server, atau buka langsung di browser.
3. Gunakan salah satu akun demo:
   - Warga: `warga_unikom` / `warga123`
   - Admin RT: `pak_rt` / `rt123`

Koneksi internet diperlukan untuk memuat Tailwind CSS, Font Awesome, dan DM Sans dari CDN.

## Fitur demo

- Dasbor rumah, ringkasan energi, tren harian, dan riwayat konsumsi bertanggal.
- Analitik konsumsi, biaya, emisi, serta perbandingan perangkat.
- Profil ruangan, evaluasi kondisi, dan rekomendasi penghematan.
- Pencatatan perangkat dan tagihan listrik.
- Estimasi jejak karbon dan kalkulator potensi panel surya.
- Preferensi dan profil lokal.

Data perangkat, rumah, tagihan, profil, ruangan, preferensi, dan riwayat harian tersimpan di browser yang digunakan. Tagihan terbaru yang memiliki data kWh menjadi sumber konsumsi dan nominal untuk ringkasan energi. Saat perangkat ditambah atau dihapus, sumber konsumsi beralih ke estimasi perangkat; saat tagihan disimpan, sumber beralih kembali ke tagihan terbaru. Dasbor menyimpan satu snapshot estimasi harian saat dibuka dan memperbarui snapshot pada tanggal yang sama; estimasi harian diturunkan dari konsumsi bulanan, bukan pembacaan meter per tanggal. Hari tanpa snapshot tidak diisi dengan angka rekaan. Data awal contoh disediakan untuk membantu melihat alur demo.

## Dasar perhitungan

- Konsumsi perangkat bulanan (kWh) = daya (W) × jumlah unit × jam per hari × hari pemakaian ÷ 1.000.
- Estimasi biaya listrik = konsumsi (kWh) × tarif listrik (Rp/kWh).
- Estimasi emisi listrik = konsumsi (kWh) × 0,87 kg CO₂/kWh.
- Emisi gas memakai faktor aplikasi 2 kg CO₂ per unit input gas; transportasi memakai 0,21 kg CO₂ per km; emisi tambahan dicatat dalam kg CO₂. Faktor dan satuan input perlu ditinjau sebelum digunakan sebagai angka resmi.
- Kalkulator surya memperkirakan produksi bulanan dari kapasitas panel × jam matahari efektif × 30 hari × faktor performa 0,80 × faktor naungan. Kapasitas juga dibatasi oleh luas atap, dengan asumsi 5 m² per kWp.
- Biaya pemasangan dihitung dari kapasitas (Wp) × nilai biaya per Wp yang dimasukkan. Perkiraan balik modal membagi biaya pemasangan dengan penghematan tahunan.

Semua hasil adalah estimasi berdasarkan informasi dan asumsi yang dimasukkan, bukan pengukuran meter, audit energi, penawaran pemasangan, atau jaminan hasil aktual.

## Batasan demo

- Login memakai akun contoh di sisi klien dan bukan autentikasi aman. Jangan gunakan kredensial atau data pribadi sungguhan.
- Data hanya tersimpan di browser/perangkat setempat dan dapat hilang jika penyimpanan browser dibersihkan.
- Ringkasan Dashboard RT menggunakan angka agregat statis untuk demonstrasi, bukan data warga yang terhubung.
- Fitur masuk sosial dan pendaftaran akun belum terhubung ke layanan autentikasi.
- Faktor emisi dan asumsi kalkulator surya perlu diverifikasi terhadap sumber dan kondisi lokal sebelum digunakan untuk keputusan nyata.
