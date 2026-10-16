
/* =========================================================
   PIJARBUMI — CORE APPLICATION
   Data lokal, kalkulasi energi, dan integrasi halaman.
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'pijarBumiDataV1';
  const ROOM_KEY = 'pijarBumiRuanganV1';
  const SETTINGS_KEY = 'pijarBumiSettingsV1';

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
      tarif: 1444
    },
    devices: [
      {
        id: 1,
        name: 'Lampu LED',
        room: 'Ruang Keluarga',
        watt: 10,
        qty: 4,
        hours: 6,
        days: 30
      },
      {
        id: 2,
        name: 'Televisi',
        room: 'Ruang Keluarga',
        watt: 80,
        qty: 1,
        hours: 5,
        days: 30
      },
      {
        id: 3,
        name: 'Kulkas',
        room: 'Dapur',
        watt: 120,
        qty: 1,
        hours: 24,
        days: 30
      }
    ],
    bills: [
      {
        id: 1,
        month: 'Bulan ini',
        kwh: 145,
        amount: 209481,
        date: '',
        manual: false
      },
      {
        id: 2,
        month: 'Bulan lalu',
        kwh: 160,
        amount: 230000,
        date: '',
        manual: false
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
      gas: 0,
      transport: 0
    },
    settings: {
      notifications: true
    }
  };

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

    // Tagihan manual menjadi sumber utama jika ditandai manual.
    // Jika tidak, total pemakaian berasal dari daftar perangkat.
    const kwh = latestBill.manual
      ? positive(latestBill.kwh)
      : data.devices.length > 0
        ? deviceKwh
        : positive(latestBill.kwh);

    const tariff = positive(data.house.tarif) || 1444;
    const cost = kwh * tariff;
    const daily = kwh / 30;

    // Faktor estimasi, bukan pengukuran emisi resmi.
    const electricityCarbon = kwh * 0.87;
    const gasCarbon = positive(data.otherCarbon.gas) * 2;
    const transportCarbon = positive(data.otherCarbon.transport) * 0.21;

    return {
      deviceKwh,
      kwh,
      tariff,
      cost,
      daily,
      electricityCarbon,
      gasCarbon,
      transportCarbon,
      carbon: electricityCarbon + gasCarbon + transportCarbon
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

      if (data.bills[0]) data.bills[0].manual = false;

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
      return saveData();
    },

    deleteDevice(id) {
      const before = data.devices.length;

      data.devices = data.devices.filter(
        item => String(item.id) !== String(id)
      );

      if (before === data.devices.length) return false;

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

  function getPageMain() {
    return document.querySelector('main');
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function renderDashboard() {
    const result = calculateEnergy();

    const name =
      data.profile.name ||
      localStorage.getItem('namaPengguna') ||
      'Warga';

    setText('sapaanUser', `Hai, ${name}!`);

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
      ['#nilaiKwh', '#totalKwh', '[data-energy="kwh"]'],
      `${formatNumber(result.kwh)} kWh`
    );

    setFirstExisting(
      ['#nilaiBiaya', '#totalBiaya', '[data-energy="cost"]'],
      formatMoney(result.cost)
    );

    setFirstExisting(
      ['#nilaiHarian', '#pemakaianHarian', '[data-energy="daily"]'],
      `${formatNumber(result.daily)} kWh`
    );

    setFirstExisting(
      ['#nilaiKarbon', '#totalKarbon', '[data-energy="carbon"]'],
      `${formatNumber(result.carbon)} kg CO₂`
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
     TAGIHAN
     ========================================================= */

  function renderBills() {
    const parent = getPageMain();

    if (!parent || $('billManager')) return;

    const section = document.createElement('section');

    section.id = 'billManager';
    section.className =
      'mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6';

    section.innerHTML = `
      <h2 class="mb-2 text-lg font-extrabold text-gray-800">
        Catat tagihan listrik
      </h2>
      <p class="mb-4 text-sm text-gray-500">
        Masukkan pemakaian listrik dari tagihan PLN.
      </p>

      <form id="billForm" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="month" required maxlength="60"
               placeholder="Periode tagihan"
               class="rounded-xl border p-3">

        <input name="kwh" type="number" min="0" step="0.1" required
               placeholder="Pemakaian kWh"
               class="rounded-xl border p-3">

        <button type="submit"
                class="rounded-xl bg-indigo-600 p-3 font-bold text-white hover:bg-indigo-700">
          Simpan tagihan
        </button>
      </form>

      <div class="mt-5 space-y-2">
        ${data.bills.map(bill => `
          <div class="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
            <div>
              <p class="font-bold text-gray-800">
                ${escapeHTML(bill.month)}
              </p>
              <p class="text-xs text-gray-500">
                ${formatNumber(bill.kwh)} kWh
              </p>
            </div>
            <p class="font-bold text-gray-800">
              ${formatMoney(bill.amount ?? bill.kwh * (positive(data.house.tarif) || 1444))}
            </p>
          </div>
        `).join('')}
      </div>
    `;

    parent.appendChild(section);

    $('billForm').addEventListener('submit', event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);
      const kwh = positive(form.get('kwh'));
      const month = String(form.get('month') || '').trim();

      if (!month) {
        alert('Periode tagihan wajib diisi.');
        return;
      }

      const tariff = positive(data.house.tarif) || 1444;

      data.bills.unshift({
        id: Date.now(),
        month,
        kwh,
        amount: kwh * tariff,
        date: new Date().toISOString().slice(0, 10),
        manual: true
      });

      data.bills = data.bills.slice(0, 12);

      if (saveData()) location.reload();
    });
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
    const parent = getPageMain();

    data.settings = {
      ...data.settings,
      ...readJSON(SETTINGS_KEY, {})
    };

    const form = $('profileForm');

    if (form && !form.dataset.pijarBound) {
      form.dataset.pijarBound = 'true';

      const nameInput = form.querySelector('[name="name"]');
      const emailInput = form.querySelector('[name="email"]');
      const notificationInput = form.querySelector('[name="notifications"]');

      if (nameInput) nameInput.value = data.profile.name || '';
      if (emailInput) emailInput.value = data.profile.email || '';
      if (notificationInput) {
        notificationInput.checked = Boolean(data.settings.notifications);
      }

      form.addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(form);

        data.profile = {
          name: String(formData.get('name') || '').trim(),
          email: String(formData.get('email') || '').trim()
        };

        data.settings.notifications = formData.has('notifications');

        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
          localStorage.setItem('namaPengguna', data.profile.name);

          if (saveData()) alert('Pengaturan berhasil disimpan.');
        } catch (error) {
          console.error(error);
          alert('Pengaturan gagal disimpan.');
        }
      });
    }

    // Tidak membuat section kosong jika halaman belum menyediakan form.
    if (parent && !$('profileSettings') && !form) {
      const section = document.createElement('section');

      section.id = 'profileSettings';
      section.className =
        'mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6';

      section.innerHTML = `
        <h2 class="mb-4 text-lg font-extrabold text-gray-800">
          Pengaturan profil
        </h2>
        <form id="profileForm" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">
            Nama
            <input name="name" required maxlength="100"
                   value="${escapeHTML(data.profile.name)}"
                   class="mt-1 block w-full rounded-xl border p-3">
          </label>
          <label class="block text-sm font-medium text-gray-700">
            Email
            <input name="email" type="email" maxlength="150"
                   value="${escapeHTML(data.profile.email)}"
                   class="mt-1 block w-full rounded-xl border p-3">
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input name="notifications" type="checkbox"
                   ${data.settings.notifications ? 'checked' : ''}>
            Aktifkan notifikasi
          </label>
          <button type="submit"
                  class="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">
            Simpan pengaturan
          </button>
        </form>
        <button id="resetData" type="button"
                class="mt-4 rounded-xl border border-red-200 px-4 py-2 font-bold text-red-600">
          Hapus data lokal
        </button>
      `;

      parent.appendChild(section);

      // Pasang listener setelah section dan form dibuat.
      renderSettings();
      return;
    }

    $('resetData')?.addEventListener('click', () => {
      if (!confirm('Hapus seluruh data PijarBumi dari browser ini?')) return;

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ROOM_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem('namaPengguna');

      location.reload();
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
        tarif: positive(getValue('tarifKwh')) || 1444
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
      '1 KK demo'
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

      case 'tagihan.html':
        renderBills();
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
