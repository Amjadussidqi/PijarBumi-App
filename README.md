# PijarBumi (demo lokal)

Aplikasi prototipe pengelolaan energi rumah berbasis HTML, Tailwind CDN, JavaScript, dan `localStorage` browser. Tidak membutuhkan server/backend, tetapi koneksi internet diperlukan untuk memuat Tailwind dan Font Awesome.

## Menjalankan
1. Ekstrak folder `PijarBumi-App-main`.
2. Buka `index.html` di browser (lebih stabil melalui VS Code Live Server).
3. Login demo warga: `warga_unikom` / `warga123`.
4. Login demo admin RT: `pak_rt` / `rt123`.

## Data yang terhubung
- Profil, data rumah, perangkat, ruangan, tagihan, input jejak karbon, dan kalkulator surya tersimpan pada `localStorage` browser.
- Dashboard dan Analitik mengambil nilai dari model data yang sama.
- Menambah perangkat menghitung estimasi konsumsi; menyimpan tagihan membuat pemakaian tagihan menjadi sumber angka analitik hingga data perangkat diubah lagi.
- Tombol reset pada Pengaturan mengembalikan data demo.

## Rumus yang dipakai
- Energi perangkat bulanan (kWh) = daya (W) × jumlah perangkat × jam pemakaian per hari × hari aktif ÷ 1.000.
- Estimasi biaya listrik = pemakaian (kWh) × tarif PLN (Rp/kWh).
- Estimasi emisi listrik = pemakaian (kWh) × 0,87 kg CO₂/kWh.
- Emisi total = emisi listrik + (input gas × 2,0) + (jarak transportasi km × 0,21). Faktor gas adalah asumsi prototipe dan satuannya perlu disesuaikan dengan metode pengukuran yang sebenarnya.
- Estimasi produksi surya = kapasitas panel (kWp) × jam matahari efektif × 0,75 × 30 hari.
- Biaya awal surya diasumsikan Rp15.000.000/kWp; balik modal = biaya awal ÷ estimasi penghematan tahunan. Ini perkiraan awal, bukan pengganti survei teknis atau penawaran pemasang.

## Batasan
Ini masih prototipe front-end: data hanya tersimpan di browser/perangkat yang sama, bukan sinkron antar pengguna atau perangkat; login demo bukan autentikasi aman; dan data/faktor emisi perlu diverifikasi sebelum dipakai untuk keputusan nyata.
