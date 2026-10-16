
/* =========================================================
   PIJARBUMI — CORE APPLICATION
   Data lokal, kalkulasi energi, dan integrasi halaman.
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'pijarBumiDataV1';
  const ROOM_KEY = 'pijarBumiRuanganV1';
  const SETTINGS_KEY = 'pijarBumiSettingsV1';
  const DAILY_HISTORY_KEY = 'pijarBumiDailyHistoryV1';

  const DEFAULT_DATA = {
    profile: {
      name: 'Unikom1',
      email: 'warga@pijarbumi.local'
    },
    house: {
      nama: 'Rumah Utama',
      alamat: 'Bandung',
      jenis: 'SINGLE FAMILY',
      luas: 100,
      tahun: 2020,
      kamarTidur: 3,
      kamarMandi: 2,
      tarif: 1444,
      demo: true
    },
    energySource: 'bill',
    devices: [
      {
        id: 1,
        name: 'Lampu LED',
        room: 'Ruang Keluarga',
        watt: 10,
        qty: 4,
        hours: 6,
        days: 30,
        demo: true
      },
      {
        id: 2,
        name: 'Televisi',
        room: 'Ruang Keluarga',
        watt: 80,
        qty: 1,
        hours: 5,
        days: 30,
        demo: true
      },
      {
        id: 3,
        name: 'Kulkas',
        room: 'Dapur',
        watt: 120,
        qty: 1,
        hours: 24,
        days: 30,
        demo: true
      }
    ],
    bills: [
      {
        id: 1,
        month: 'Bulan ini',
        kwh: 145,
        amount: 209380,
        date: '',
        manual: true,
        demo: true
      },
      {
        id: 2,
        month: 'Bulan lalu',
        kwh: 160,
        amount: 231040,
        date: '',
        manual: false,
        demo: true
      }
    ],
    solar: {
      usage: 150,
      tariff: 1444,
      sunHours: 5,
      panel: 1.5,
      roof: 'Miring',
      system: 'On-grid'
    },
    otherCarbon: {
      gas: 4.5,
      transport: 0,
      otherEnergy: 8.4
    },
    settings: {
      notifications: true
    }
  };

  const DEFAULT_ROOMS = [
    {
      id: 'contoh-kamar-tidur',
      nama: 'Kamar Tidur',
      jenis: 'kamar',
      luas: 12,
      penghuni: 2,
      cahaya: 'sedang',
      ventilasi: 'sedang',
      jamPakai: 12,
      lampu: 'nonled',
      ac: 'ya',
      prioritas: 'tinggi',
      catatan: '',
      demo: true
    },
    {
      id: 'contoh-ruang-keluarga',
      nama: 'Ruang Keluarga',
      jenis: 'keluarga',
      luas: 20,
      penghuni: 3,
      cahaya: 'baik',
      ventilasi: 'minim',
      jamPakai: 14,
      lampu: 'led',
      ac: 'tidak',
      prioritas: 'normal',
      catatan: '',
      demo: true
    }
  ];

  const $ = id => document.getElementById(id);

  const number = value => {
    if (typeof value === 'string') {
      value = value.trim().replace(',', '.');
    }

    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
  };

  const positive = value => Math.max(0, number(value));
  const clone = value => JSON.parse(JSON.stringify(value));

  const escapeHTML = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const formatNumber = (value, decimals = 1) =>
    new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: decimals
    }).format(number(value));

  const formatMoney = value =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(positive(value));

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);

      const parsed = JSON.parse(raw);
      return parsed ?? clone(fallback);
    } catch (error) {
      console.warn(`PijarBumi: gagal membaca ${key}`, error);
      return clone(fallback);
    }
  }

  function loadData() {
    const saved = readJSON(STORAGE_KEY, {});

    return {
      ...clone(DEFAULT_DATA),
      ...saved,
      profile: {
        ...DEFAULT_DATA.profile,
        ...(saved.profile || {})
      },
      house: {
        ...DEFAULT_DATA.house,
        ...(saved.house || {})
      },
      devices: Array.isArray(saved.devices)
        ? saved.devices
        : clone(DEFAULT_DATA.devices),
      bills: Array.isArray(saved.bills)
        ? saved.bills
        : clone(DEFAULT_DATA.bills),
      solar: {
        ...DEFAULT_DATA.solar,
        ...(saved.solar || {})
      },
      otherCarbon: {
        ...DEFAULT_DATA.otherCarbon,
        ...(saved.otherCarbon || {})
      },
      settings: {
        ...DEFAULT_DATA.settings,
        ...(saved.settings || {})
      }
    };
  }

  let data = loadData();

  function seedDemoData() {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== null) return;
      if (!saveData()) return;
      if (localStorage.getItem(ROOM_KEY) === null) saveRooms(DEFAULT_ROOMS);
    } catch (error) {
      console.error('PijarBumi: gagal menyiapkan data contoh.', error);
    }
  }

  seedDemoData();

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('PijarBumi: gagal menyimpan data.', error);
      alert('Data gagal disimpan. Periksa penyimpanan browser.');
      return false;
    }
  }

  function loadRooms() {
    const rooms = readJSON(ROOM_KEY, []);
    return Array.isArray(rooms) ? rooms : [];
  }

  function saveRooms(rooms) {
    if (!Array.isArray(rooms)) {
      console.error('PijarBumi: data ruangan harus berupa array.');
      return false;
    }

    try {
      localStorage.setItem(ROOM_KEY, JSON.stringify(rooms));
      return true;
    } catch (error) {
      console.error('PijarBumi: gagal menyimpan ruangan.', error);
      alert('Data ruangan gagal disimpan.');
      return false;
    }
  }

  /* =========================================================
     KALKULASI ENERGI
     ========================================================= */

  function calculateDevice(device = {}) {
    const watt = positive(device.watt);
    const qty = positive(device.qty);
    const hours = Math.min(24, positive(device.hours));
    const days = Math.min(31, positive(device.days));

    const kwh = watt * qty * hours * days / 1000;
    const tariff = positive(data.house.tarif) || 1444;

    return {
      kwh,
      cost: kwh * tariff
    };
  }

  function calculateAllDevices() {
    return data.devices.reduce(
      (total, device) => total + calculateDevice(device).kwh,
      0
    );
  }

  function calculateEnergy() {
    const deviceKwh = calculateAllDevices();
    const latestBill = data.bills[0] || {
      kwh: 0,
      amount: 0,
      manual: false
    };
    const manualBill = data.bills.find(bill => bill && bill.manual === true);

    // Tagihan manual menjadi sumber utama jika ditandai manual.
    // Jika tidak, total pemakaian berasal dari daftar perangkat.
    const gunakanTagihan = data.energySource === 'bill' ||
      (!data.energySource && manualBill);
    const kwh = gunakanTagihan && manualBill
      ? positive(manualBill.kwh)
      : data.devices.length > 0
        ? deviceKwh
        : !data.energySource
          ? positive(latestBill.kwh)
          : 0;

    const tariff = positive(data.house.tarif) || 1444;
    const cost = gunakanTagihan && manualBill
      ? positive(manualBill.amount)
      : kwh * tariff;
    const daily = kwh / 30;

    // Faktor estimasi, bukan pengukuran emisi resmi.
    const electricityCarbon = kwh * 0.87;
    const gasCarbon = positive(data.otherCarbon.gas) * 2;
    const transportCarbon = positive(data.otherCarbon.transport) * 0.21;
    const otherCarbon = positive(data.otherCarbon.otherEnergy);

    return {
      deviceKwh,
      kwh,
      tariff,
      cost,
      daily,
      electricityCarbon,
      gasCarbon,
      transportCarbon,
      otherCarbon,
      carbon: electricityCarbon + gasCarbon + transportCarbon + otherCarbon
    };
  }

  /* =========================================================
     API GLOBAL
     ========================================================= */

  window.PijarBumi = {
    getData() {
      return clone(data);
    },

    saveData,

    getRooms() {
      return loadRooms();
    },

    saveRooms,

    getDevices() {
      return clone(data.devices);
    },

    addDevice(device) {
      if (!device || !String(device.name || '').trim()) {
        return false;
      }

      data.devices.push({
        id: device.id ?? Date.now(),
        name: String(device.name).trim(),
        room: String(device.room || 'Lainnya').trim(),
        watt: positive(device.watt),
        qty: Math.max(1, positive(device.qty)),
        hours: Math.min(24, positive(device.hours)),
        days: Math.min(31, positive(device.days || 30))
      });

      data.bills.forEach(bill => {
        bill.manual = false;
      });
      data.energySource = 'devices';

      return saveData();
    },

    updateDevice(id, changes) {
      const device = data.devices.find(
        item => String(item.id) === String(id)
      );

      if (!device || !changes || typeof changes !== 'object') {
        return false;
      }

      Object.assign(device, changes);
      delete device.demo;
      data.bills.forEach(bill => {
        bill.manual = false;
      });
      data.energySource = 'devices';
      return saveData();
    },

    deleteDevice(id) {
      const before = data.devices.length;

      data.devices = data.devices.filter(
        item => String(item.id) !== String(id)
      );

      if (before === data.devices.length) return false;

      data.bills.forEach(bill => {
        bill.manual = false;
      });
      data.energySource = 'devices';
      return saveData();
    },

    calculateDevice,
    calculateAllDevices,
    calculateEnergy,
    formatNumber,
    formatMoney,
    escapeHTML
  };

  /* =========================================================
     UTILITAS RENDER
     ========================================================= */

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setHTML(id, value) {
    const element = $(id);
    if (element) element.innerHTML = value;
  }

  function setFirstExisting(selectors, value) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);

      if (element) {
        element.innerHTML = value;
        return true;
      }
    }

    return false;
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function renderDashboard() {
    const result = calculateEnergy();

    const name = getProfileName();
    const initial = Array.from(name.trim())[0]?.toLocaleUpperCase('id-ID') || 'W';

    setText('sapaanUser', `Hai, ${name}!`);
    setText('namaDashboard', name);
    setText('avatarDashboard', initial);

    const houseInfo = $('areaInfoRumah');

    if (houseInfo) {
      houseInfo.innerHTML = `
        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-gray-400">
                Rumah aktif
              </p>
              <h2 class="mt-1 text-xl font-black text-gray-800">
                ${escapeHTML(data.house.nama)}
              </h2>
              ${data.house.demo ? '<span class="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">Data contoh</span>' : ''}
              <p class="mt-1 text-sm text-gray-500">
                <i class="fa-solid fa-location-dot mr-1"></i>
                ${escapeHTML(data.house.alamat)}
                · ${escapeHTML(data.house.jenis)}
              </p>
              <p class="mt-2 text-xs text-gray-400">
                ${formatNumber(data.house.luas, 0)} m²
                · ${formatNumber(data.house.kamarTidur, 0)} kamar tidur
                · Tarif ${formatMoney(result.tariff)}/kWh
              </p>
            </div>
            <a href="tambah_rumah.html"
               class="text-sm font-bold text-indigo-600 hover:text-indigo-800">
              Edit rumah
            </a>
          </div>
        </div>
      `;
    }

    // Utamakan ID spesifik supaya ikon dan elemen lain tidak tertimpa.
    setFirstExisting(
      ['#valTotalKwh', '#nilaiKwh', '#totalKwh', '[data-energy="kwh"]'],
      `${formatNumber(result.kwh)} kWh`
    );

    setFirstExisting(
      ['#valTotalBiaya', '#nilaiBiaya', '#totalBiaya', '[data-energy="cost"]'],
      formatMoney(result.cost)
    );

    setFirstExisting(
      ['#valRataHarian', '#nilaiHarian', '#pemakaianHarian', '[data-energy="daily"]'],
      `${formatNumber(result.daily)} kWh`
    );

    setFirstExisting(
      ['#valCo2', '#nilaiKarbon', '#totalKarbon', '[data-energy="carbon"]'],
      `${formatNumber(result.carbon)} kg CO₂`
    );

    renderDashboardChart();
  }

  function getProfileName() {
    return String(
      data.profile.name || localStorage.getItem('namaPengguna') || 'Warga'
    ).trim() || 'Warga';
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function saveDailyEnergySnapshot(dailyKwh) {
    let history = readJSON(DAILY_HISTORY_KEY, []);
    if (!Array.isArray(history)) history = [];

    const today = new Date();
    const todayKey = localDateKey(today);
    const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 89);
    const cutoffKey = localDateKey(cutoff);
    const snapshots = history.filter(item =>
      item &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      item.date >= cutoffKey &&
      Number.isFinite(Number(item.kwh)) &&
      Number(item.kwh) >= 0
    );
    const todaySnapshot = {
      date: todayKey,
      kwh: positive(dailyKwh)
    };
    const existingIndex = snapshots.findIndex(item => item.date === todayKey);

    if (existingIndex >= 0) {
      snapshots[existingIndex] = todaySnapshot;
    } else {
      snapshots.push(todaySnapshot);
    }

    snapshots.sort((a, b) => a.date.localeCompare(b.date));

    let saved = true;
    try {
      localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(snapshots));
    } catch (error) {
      saved = false;
      console.error('PijarBumi: gagal menyimpan riwayat energi harian.', error);
    }

    return { history: snapshots, saved };
  }

  function renderDashboardChart() {
    const chart = $('grafikDashboard');
    if (!chart) return;

    const { history, saved } = saveDailyEnergySnapshot(calculateEnergy().daily);
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
      const key = localDateKey(date);
      const snapshot = history.find(item => item.date === key);

      return {
        date,
        key,
        kwh: snapshot ? Number(snapshot.kwh) : null,
        label: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short'
        }).format(date)
      };
    });
    const recorded = days.filter(day => day.kwh !== null);
    const left = 20;
    const right = 722;
    const top = 24;
    const bottom = 226;
    const maximum = Math.max(1, ...recorded.map(day => day.kwh)) * 1.15;
    const xFor = index => left + index * (right - left) / (days.length - 1);
    const yFor = value => bottom - value / maximum * (bottom - top);
    const segments = [];
    let segment = [];

    days.forEach((day, index) => {
      if (day.kwh === null) {
        if (segment.length) segments.push(segment);
        segment = [];
      } else {
        segment.push({ ...day, index, x: xFor(index), y: yFor(day.kwh) });
      }
    });
    if (segment.length) segments.push(segment);

    const grid = [0, 0.5, 1].map(ratio => {
      const y = bottom - ratio * (bottom - top);
      return `
        <line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#e8eaf5" stroke-dasharray="4 5"/>`;
    }).join('');

    const areas = segments
      .filter(points => points.length > 1)
      .map(points => {
        const line = points.map((point, index) =>
          `${index ? 'L' : 'M'} ${point.x} ${point.y}`
        ).join(' ');
        return `<path d="${line} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z" fill="url(#areaFill)"/>`;
      }).join('');
    const lines = segments
      .filter(points => points.length > 1)
      .map(points => `<path d="${points.map((point, index) =>
        `${index ? 'L' : 'M'} ${point.x} ${point.y}`
      ).join(' ')}" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join('');
    const recordedPoints = segments.flat();
    const gapLines = recordedPoints.slice(1).map((point, index) => {
      const previous = recordedPoints[index];
      return point.index - previous.index > 1
        ? `<path d="M ${previous.x} ${previous.y} L ${point.x} ${point.y}" fill="none" stroke="#818cf8" stroke-width="2" stroke-dasharray="5 5"/>`
        : '';
    }).join('');
    const points = segments.flat().map(point => `
      <circle cx="${point.x}" cy="${point.y}" r="5" fill="#fff" stroke="#4f46e5" stroke-width="3">
        <title>${point.label}: ${formatNumber(point.kwh, 2)} kWh/hari</title>
      </circle>`).join('');
    const labels = days.map(day => `
      <span class="truncate text-center text-[10px] ${day.kwh === null ? 'text-slate-300' : 'text-slate-500'}">${day.label}</span>`).join('');

    chart.innerHTML = `
      <svg class="block h-32 w-full sm:h-40" viewBox="0 0 740 260" preserveAspectRatio="none" role="img" aria-label="Tren estimasi konsumsi energi harian selama tujuh hari terakhir">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity=".22"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity=".02"/>
          </linearGradient>
        </defs>
        ${grid}
        ${areas}
        ${lines}
        ${gapLines}
        ${points}
      </svg>
      <div class="grid grid-cols-7 gap-1" aria-hidden="true">${labels}</div>`;

    setText(
      'catatanGrafikDashboard',
      saved
        ? `Grafik historis menyimpan data konsumsi per tanggal. Estimasi harian dihitung dari total ${formatNumber(calculateEnergy().kwh)} kWh bulanan; hari tanpa catatan tidak ditampilkan sebagai nol.`
        : 'Riwayat hari ini tidak tersimpan. Periksa penyimpanan browser; grafik hanya menampilkan data yang berhasil dibaca.'
    );
  }

  /* =========================================================
     ANALITIK
     ========================================================= */

  function renderAnalytics() {
    const result = calculateEnergy();

    // Jangan mengganti seluruh header atau semua h3.
    // Itu bisa menghapus ikon, judul, dan elemen layout HTML.
    setFirstExisting(
      ['#analitikBiaya', '#nilaiBiaya', '[data-energy="cost"]'],
      formatMoney(result.cost)
    );

    setFirstExisting(
      ['#analitikKwh', '#nilaiKwh', '[data-energy="kwh"]'],
      `${formatNumber(result.kwh)} kWh`
    );

    setFirstExisting(
      ['#analitikHarian', '#nilaiHarian', '[data-energy="daily"]'],
      `${formatNumber(result.daily)} kWh`
    );

    setFirstExisting(
      ['#analitikKarbon', '#nilaiKarbon', '[data-energy="carbon"]'],
      `${formatNumber(result.carbon)} kg CO₂`
    );

    const trend = document.querySelector('[data-energy="trend"]');

    // Gunakan elemen khusus jika HTML memang menyediakannya.
    if (trend) {
      const percentage = Math.min(100, result.kwh / 300 * 100);

      trend.innerHTML = `
        <p class="text-sm font-bold text-gray-700">
          Pemakaian listrik: ${formatNumber(result.kwh)} kWh/bulan
        </p>
        <div class="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
          <div class="h-full rounded-full bg-indigo-500"
               style="width:${percentage}%"></div>
        </div>
        <p class="mt-2 text-xs text-gray-400">
          Estimasi biaya = kWh × tarif listrik.
          Estimasi emisi listrik = kWh × 0,87 kg CO₂.
        </p>
      `;
    }
  }

  /* =========================================================
     JEJAK KARBON
     ========================================================= */

  function renderCarbon() {
    /*
     * Kalkulator jejak karbon ditangani oleh jejak_karbon.html.
     * Jangan membuat form kedua di sini agar tidak duplikat.
     * HTML dapat mengambil data melalui window.PijarBumi:
     *   PijarBumi.getData()
     *   PijarBumi.calculateEnergy()
     *
     * Jika HTML menggunakan ID form carbonForm, listener berikut
     * menyimpan inputnya ke sumber data utama.
     */
    const form = $('carbonForm');

    if (!form || form.dataset.pijarBound === 'true') return;

    form.dataset.pijarBound = 'true';

    const gasInput = form.querySelector('[name="gas"]');
    const transportInput = form.querySelector('[name="transport"]');

    if (gasInput) gasInput.value = positive(data.otherCarbon.gas);
    if (transportInput) {
      transportInput.value = positive(data.otherCarbon.transport);
    }

    form.addEventListener('submit', event => {
      event.preventDefault();

      const formData = new FormData(form);

      data.otherCarbon = {
        gas: positive(formData.get('gas')),
        transport: positive(formData.get('transport'))
      };

      if (saveData()) location.reload();
    });
  }

  /* =========================================================
     PENGATURAN
     ========================================================= */

  function renderSettings() {
    data.settings = {
      ...data.settings,
      ...readJSON(SETTINGS_KEY, {})
    };

    const profile = data.profile;
    const name = String(
      profile.name || localStorage.getItem('namaPengguna') || 'Warga'
    ).trim() || 'Warga';
    const email = String(profile.email || '');
    const initial = Array.from(name)[0]?.toLocaleUpperCase('id-ID') || 'W';

    $('avatarProfil').textContent = name.trim().charAt(0).toUpperCase() || 'W';
    setText('avatarHeaderPengaturan', initial);
    setText('namaHeaderPengaturan', name);
    $('namaProfil').textContent = name;
    $('emailProfil').textContent = email || 'Belum ada email';
    $('ringkasNama').textContent = name;
    $('inputNama').value = name;
    $('inputEmail').value = email;

    const form = $('profileForm');
    if (!form || form.dataset.pijarBound === 'true') return;
    form.dataset.pijarBound = 'true';

    form.addEventListener('submit', event => {
      event.preventDefault();

      const formData = new FormData(form);
      const updatedName = String(formData.get('name') || '').trim();
      const updatedEmail = String(formData.get('email') || '').trim();

      if (!updatedName) {
        alert('Nama pengguna tidak boleh kosong.');
        return;
      }

      data.profile = {
        ...data.profile,
        name: updatedName,
        email: updatedEmail
      };

      try {
        localStorage.setItem('namaPengguna', updatedName);

        if (!saveData()) return;

        const updatedInitial =
          Array.from(updatedName)[0]?.toLocaleUpperCase('id-ID') || 'W';
        $('avatarProfil').textContent = updatedInitial;
        setText('avatarHeaderPengaturan', updatedInitial);
        setText('namaHeaderPengaturan', updatedName);
        $('namaProfil').textContent = updatedName;
        $('emailProfil').textContent = updatedEmail || 'Belum ada email';
        $('ringkasNama').textContent = updatedName;
        window.tutupModal('modalProfil');
        window.tampilToast('Profil berhasil disimpan.');
      } catch (error) {
        console.error('PijarBumi: gagal menyimpan profil.', error);
        alert('Profil gagal disimpan.');
      }
    });
  }

  /* =========================================================
     FORM TAMBAH / EDIT RUMAH
     ========================================================= */

  function renderHouseForm() {
    const form = $('formRumah');

    if (!form || form.dataset.pijarBound === 'true') return;
    form.dataset.pijarBound = 'true';

    const fields = {
      namaRumah: 'nama',
      alamatRumah: 'alamat',
      jenisRumah: 'jenis',
      luasRumah: 'luas',
      tahunRumah: 'tahun',
      kamarTidur: 'kamarTidur',
      kamarMandi: 'kamarMandi',
      tarifKwh: 'tarif'
    };

    Object.entries(fields).forEach(([id, key]) => {
      const input = $(id);
      if (input && data.house[key] !== undefined) {
        input.value = data.house[key];
      }
    });

    form.addEventListener('submit', event => {
      event.preventDefault();

      const getValue = id => $(id)?.value ?? '';
      const name = getValue('namaRumah').trim();
      const address = getValue('alamatRumah').trim();

      if (!name || !address) {
        alert('Nama dan alamat rumah wajib diisi.');
        return;
      }

      data.house = {
        nama: name,
        alamat: address,
        jenis: getValue('jenisRumah') || 'SINGLE FAMILY',
        luas: positive(getValue('luasRumah')),
        tahun: positive(getValue('tahunRumah')) || new Date().getFullYear(),
        kamarTidur: positive(getValue('kamarTidur')),
        kamarMandi: positive(getValue('kamarMandi')),
        tarif: positive(getValue('tarifKwh')) || 1444,
        demo: false
      };

      if (saveData()) {
        location.href = 'dashboard.html';
      }
    });
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  window.prosesLogin = function () {
    const username = $('username')?.value.trim();
    const password = $('password')?.value;
    const buttonText = $('textTombol');
    const loadingIcon = $('loadingIcon');

    if (!username || !password) {
      alert('Harap isi username dan password.');
      return;
    }

    const accounts = {
      warga_unikom: {
        password: 'warga123',
        name: 'Unikom1',
        destination: 'dashboard.html'
      },
      pak_rt: {
        password: 'rt123',
        name: 'Pak RT',
        destination: 'dashboard_rt.html'
      }
    };

    if (buttonText) buttonText.textContent = 'Memverifikasi...';
    loadingIcon?.classList.remove('hidden');

    const account = accounts[username];

    if (!account || account.password !== password) {
      alert('Username atau password salah.');

      if (buttonText) buttonText.textContent = 'Masuk Sekarang';
      loadingIcon?.classList.add('hidden');
      return;
    }

    data.profile.name = account.name;
    localStorage.setItem('namaPengguna', account.name);

    if (saveData()) {
      location.href = account.destination;
    } else {
      if (buttonText) buttonText.textContent = 'Masuk Sekarang';
      loadingIcon?.classList.add('hidden');
    }
  };

  /* =========================================================
     LOGOUT
     ========================================================= */

  window.prosesLogout = function () {
    localStorage.removeItem('namaPengguna');
    window.location.href = './index.html';
  };

  /* =========================================================
     DASHBOARD RT
     ========================================================= */

  function renderRTDashboard() {
    const result = calculateEnergy();

    setFirstExisting(
      ['#jumlahKK', '[data-rt="kk"]'],
      '1 KK terdata'
    );

    setFirstExisting(
      ['#pemakaianRT', '[data-rt="kwh"]'],
      `${formatNumber(result.kwh)} kWh`
    );

    setFirstExisting(
      ['#karbonRT', '[data-rt="carbon"]'],
      `${formatNumber(result.carbon)} kg CO₂`
    );
  }

  /* =========================================================
     INISIALISASI HALAMAN
     ========================================================= */

  document.addEventListener('DOMContentLoaded', () => {
    const page = location.pathname.split('/').pop();

    switch (page) {
      case 'dashboard.html':
        renderDashboard();
        break;

      case 'analitik.html':
        renderAnalytics();
        break;

      case 'jejak_karbon.html':
        renderCarbon();
        break;

      case 'pengaturan.html':
        renderSettings();
        break;

      case 'tambah_rumah.html':
        renderHouseForm();
        break;

      case 'ruangan.html':
      case 'alat.html':
        // CRUD halaman masing-masing memakai window.PijarBumi.
        break;

      case 'dashboard_rt.html':
        renderRTDashboard();
        break;
    }
  });

})();
