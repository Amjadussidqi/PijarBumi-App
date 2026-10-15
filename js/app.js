/* PijarBumi - aplikasi demo lokal. Data tersimpan di localStorage browser. */
(function () {
  const KEY = 'pijarBumiDataV1';
  const DEFAULT = {
    profile: { name: 'Unikom1', email: 'warga@pijarbumi.local' },
    house: { nama: 'Rumah Utama', alamat: 'Bandung', jenis: 'SINGLE FAMILY', luas: 100, tahun: 2020, kamarTidur: 3, kamarMandi: 2, tarif: 1444 },
    devices: [
      { id: 1, name: 'Lampu LED', room: 'Ruang Keluarga', watt: 10, qty: 4, hours: 6, days: 30 },
      { id: 2, name: 'Televisi', room: 'Ruang Keluarga', watt: 80, qty: 1, hours: 5, days: 30 },
      { id: 3, name: 'Kulkas', room: 'Dapur', watt: 120, qty: 1, hours: 24, days: 30 }
    ],
    bills: [
      { id: 1, month: 'Bulan ini', kwh: 145, amount: 209481, date: '', manual: false },
      { id: 2, month: 'Bulan lalu', kwh: 160, amount: 230000, date: '' }
    ],
    solar: { usage: 150, tariff: 1444, sunHours: 5, panel: 1.5, roof: 'Miring', system: 'On-grid' },
    otherCarbon: { gas: 0, transport: 0 },
    settings: { notifications: true }
  };
  function load() {
    try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved) return { ...structuredClone(DEFAULT), ...saved, profile: {...DEFAULT.profile,...saved.profile}, house: {...DEFAULT.house,...saved.house}, solar: {...DEFAULT.solar,...saved.solar}, otherCarbon: {...DEFAULT.otherCarbon,...saved.otherCarbon}, settings: {...DEFAULT.settings,...saved.settings}, devices: saved.devices || DEFAULT.devices, bills: saved.bills || DEFAULT.bills }; } catch(e) {}
    return structuredClone(DEFAULT);
  }
  let data = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(data));
  const $ = id => document.getElementById(id);
  const num = v => Number(v) || 0;
  const money = v => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Math.max(0, num(v)));
  const fmt = (v, d=1) => new Intl.NumberFormat('id-ID',{maximumFractionDigits:d}).format(num(v));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Rumus: kWh perangkat = watt x jumlah x jam/hari x hari / 1000.
  function calc() {
    const deviceKwh = data.devices.reduce((s,d)=>s+(num(d.watt)*num(d.qty)*num(d.hours)*num(d.days)/1000),0);
    const bill = data.bills[0] || {kwh:0,amount:0};
    const kwh = bill.manual ? num(bill.kwh) : (deviceKwh > 0 ? deviceKwh : num(bill.kwh));
    const tariff = num(data.house.tarif) || 1444;
    const cost = kwh * tariff;
    return { deviceKwh, kwh, cost: data.devices.length ? cost : num(bill.amount), tariff, carbon: kwh*0.87 + num(data.otherCarbon.gas)*2.0 + num(data.otherCarbon.transport)*0.21, daily: kwh/30 };
  }
  function ensureSection(id, title, content, parent) {
    let el=$(id); if(!el){el=document.createElement('section');el.id=id;el.className='bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 mt-5';(parent||document.querySelector('main')||document.body).appendChild(el);} el.innerHTML=`<h2 class="text-lg font-bold text-gray-800 mb-4">${title}</h2>${content}`; return el;
  }
  function renderDashboard() {
    const c=calc(); const greet=$('sapaanUser'); if(greet) greet.textContent='Hai, '+(data.profile.name||localStorage.getItem('namaPengguna')||'Warga')+'!';
    const area=$('areaInfoRumah'); if(area) area.innerHTML=`<div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div class="flex justify-between items-start gap-3"><div><p class="text-xs uppercase tracking-wide text-gray-400 font-bold">Rumah aktif</p><h2 class="text-xl font-black text-gray-800 mt-1">${esc(data.house.nama)}</h2><p class="text-sm text-gray-500 mt-1"><i class="fa-solid fa-location-dot mr-1"></i>${esc(data.house.alamat)} · ${esc(data.house.jenis)}</p><p class="text-xs text-gray-400 mt-2">${fmt(data.house.luas,0)} m² · ${fmt(data.house.kamarTidur,0)} kamar tidur · Tarif ${money(c.tariff)}/kWh</p></div><a href="tambah_rumah.html" class="text-sm font-bold text-emerald-700">Edit rumah</a></div></div>`;
    const nums=document.querySelectorAll('main h3'); const vals=[`${fmt(c.kwh)} kWh`,money(c.cost),`${fmt(c.daily)} kWh`,`${fmt(c.carbon)} kg`];
    nums.forEach((el,i)=>{if(i<4)el.innerHTML=vals[i].replace(' kWh',' <span class="text-sm font-normal text-gray-400">kWh</span>').replace(' kg',' <span class="text-sm font-normal text-gray-400">kg</span>');});
  }
  function renderAnalytics() {
    const c=calc(); const head=document.querySelector('header .text-center'); if(head) head.innerHTML=`<span class="text-3xl md:text-4xl font-black">${money(c.cost)}</span><span class="text-xs md:text-sm text-green-100 ml-2">estimasi bulan ini</span><p class="text-xs text-green-100 mt-1">${fmt(c.kwh)} kWh · ${fmt(c.carbon)} kg CO₂</p>`;
    const cards=[...document.querySelectorAll('main h3')]; const vals=[`${fmt(c.kwh)} <span class="text-sm font-normal text-gray-400">kWh</span>`,money(c.cost),`${fmt(c.daily)} <span class="text-sm font-normal text-gray-400">kWh</span>`,`${fmt(c.carbon)} <span class="text-sm font-normal text-gray-400">kg</span>`]; cards.slice(0,4).forEach((el,i)=>el.innerHTML=vals[i]);
    const trend=document.querySelector('.border-dashed'); if(trend) trend.innerHTML=`<div class="w-full px-5"><p class="text-sm font-bold text-gray-700">Estimasi pemakaian: ${fmt(c.kwh)} kWh/bulan</p><div class="h-3 bg-gray-200 rounded-full mt-3 overflow-hidden"><div class="h-full bg-emerald-500 rounded-full" style="width:${Math.min(100,c.kwh/300*100)}%"></div></div><p class="text-xs text-gray-400 mt-2">Biaya = pemakaian × tarif PLN. Emisi listrik = kWh × 0,87 kg CO₂.</p></div>`;
  }
  function renderDevices() {
    const rows=data.devices.map(d=>`<tr class="border-t"><td class="py-3 pr-2">${esc(d.name)}<div class="text-xs text-gray-400">${esc(d.room)}</div></td><td class="py-3 text-right">${fmt(d.watt,0)} W</td><td class="py-3 text-right">${fmt(d.qty,0)}</td><td class="py-3 text-right">${fmt(d.watt*d.qty*d.hours*d.days/1000,2)} kWh</td><td class="py-3 text-right"><button data-del-device="${d.id}" class="text-red-600 font-bold" aria-label="Hapus ${esc(d.name)}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
    ensureSection('deviceManager','Perangkat & Pemakaian',`<p class="text-sm text-gray-500 mb-4">Masukkan daya, jumlah perangkat, jam pemakaian per hari, dan hari aktif. Estimasi energi dihitung otomatis.</p><form id="deviceForm" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"><input name="name" required placeholder="Nama perangkat" class="border rounded-xl p-3"><input name="room" placeholder="Ruangan" value="Ruang Keluarga" class="border rounded-xl p-3"><input name="watt" required min="1" type="number" placeholder="Daya (Watt)" class="border rounded-xl p-3"><input name="qty" required min="1" type="number" value="1" placeholder="Jumlah" class="border rounded-xl p-3"><input name="hours" required min="0" max="24" step="0.5" type="number" value="4" placeholder="Jam/hari" class="border rounded-xl p-3"><input name="days" required min="1" max="31" type="number" value="30" placeholder="Hari/bulan" class="border rounded-xl p-3"><button class="bg-emerald-700 text-white font-bold rounded-xl p-3 sm:col-span-2 lg:col-span-3">Tambah perangkat</button></form><div class="overflow-x-auto mt-5"><table class="w-full text-sm"><thead><tr class="text-gray-400 text-left"><th class="py-2">Perangkat</th><th class="text-right">Daya</th><th class="text-right">Jumlah</th><th class="text-right">kWh/bln</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="py-4 text-gray-400">Belum ada perangkat.</td></tr>'}</tbody></table></div><p class="text-sm font-bold text-emerald-800 mt-4">Total dari perangkat: ${fmt(calc().deviceKwh)} kWh/bulan</p>`);
    $('deviceForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);data.devices.push({id:Date.now(),name:f.get('name'),room:f.get('room')||'Lainnya',watt:num(f.get('watt')),qty:num(f.get('qty')),hours:num(f.get('hours')),days:num(f.get('days'))});if(data.bills[0])data.bills[0].manual=false;save();location.reload();});
    document.querySelectorAll('[data-del-device]').forEach(b=>b.addEventListener('click',()=>{data.devices=data.devices.filter(d=>d.id!==num(b.dataset.delDevice));save();location.reload();}));
  }
  function renderRooms() {
    const parent=document.querySelector('main')||document.body;
    const oldGrid=parent.querySelector('.grid.grid-cols-1'); if(oldGrid && !oldGrid.id) oldGrid.style.display='none';
    ensureSection('roomManager','Tambah ruangan',`<form id="roomForm" class="flex flex-col sm:flex-row gap-3"><input name="room" required placeholder="Nama ruangan baru" class="border rounded-xl p-3 flex-1"><button class="bg-emerald-700 text-white font-bold rounded-xl px-5 py-3">Tambah ruangan</button></form><div id="roomList" class="flex flex-wrap gap-2 mt-4"></div>`,parent);
    const rooms=[...new Set([...data.devices.map(d=>d.room).filter(Boolean)])]; $('roomList').innerHTML=rooms.map(r=>`<span class="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-sm">${esc(r)} · ${data.devices.filter(d=>d.room===r).length} perangkat</span>`).join('')||'Belum ada ruangan.';
    $('roomForm').addEventListener('submit',e=>{e.preventDefault();const room=new FormData(e.target).get('room');data.devices.push({id:Date.now(),name:'Perangkat baru',room,watt:0,qty:1,hours:0,days:30});if(data.bills[0])data.bills[0].manual=false;save();location.reload();});
  }
  function renderBills() {
    const c=calc(); const parent=document.querySelector('main')||document.body;
    const oldCards=[...parent.querySelectorAll('h3')].filter(h=>h.textContent.includes('209.481')||h.textContent.includes('230.000')); oldCards.forEach(h=>{const card=h.closest('.bg-white');if(card)card.style.display='none';});
    ensureSection('billManager','Catat tagihan listrik',`<p class="text-sm text-gray-500 mb-4">Biaya estimasi otomatis = kWh × tarif PLN rumah. Data tagihan disimpan di browser ini.</p><form id="billForm" class="grid grid-cols-1 sm:grid-cols-3 gap-3"><input name="month" required placeholder="Periode (mis. Oktober 2026)" class="border rounded-xl p-3"><input name="kwh" type="number" min="0" step="0.1" required placeholder="Pemakaian kWh" class="border rounded-xl p-3"><button class="bg-emerald-700 text-white font-bold rounded-xl p-3">Simpan tagihan</button></form><div class="mt-5 space-y-2">${data.bills.map(b=>`<div class="flex justify-between gap-3 p-3 rounded-xl bg-gray-50"><div><b>${esc(b.month)}</b><p class="text-xs text-gray-500">${fmt(b.kwh)} kWh</p></div><b>${money(b.amount||b.kwh*c.tariff)}</b></div>`).join('')}</div>` ,parent);
    $('billForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),kwh=num(f.get('kwh'));data.bills.unshift({id:Date.now(),month:f.get('month'),kwh,amount:kwh*c.tariff,date:new Date().toISOString().slice(0,10),manual:true});data.bills=data.bills.slice(0,12);save();location.reload();});
  }
  function renderCarbon() {
    const c=calc(), parent=document.querySelector('main')||document.body;
    const hero=parent.querySelector('.text-5xl'); if(hero)hero.textContent=fmt(c.carbon)+' kg';
    ensureSection('carbonInputs','Kalkulator jejak karbon',`<p class="text-sm text-gray-500 mb-4">Faktor estimasi: listrik 0,87 kg CO₂/kWh; gas 2 kg CO₂ per unit input; transportasi 0,21 kg CO₂/km. Gas dan transportasi diisi per bulan; sesuaikan satuan dengan metode pencatatan Anda.</p><form id="carbonForm" class="grid grid-cols-1 sm:grid-cols-2 gap-3"><label class="text-sm">Emisi gas (unit/bulan)<input name="gas" type="number" min="0" step="0.1" value="${num(data.otherCarbon.gas)}" class="block w-full border rounded-xl p-3 mt-1"></label><label class="text-sm">Jarak transportasi (km/bulan)<input name="transport" type="number" min="0" step="1" value="${num(data.otherCarbon.transport)}" class="block w-full border rounded-xl p-3 mt-1"></label><button class="bg-emerald-700 text-white font-bold rounded-xl p-3 sm:col-span-2">Hitung & simpan</button></form><div class="mt-4 rounded-xl bg-emerald-50 p-4"><p class="text-sm text-emerald-800">Estimasi total emisi</p><p class="text-2xl font-black text-emerald-900">${fmt(c.carbon)} kg CO₂/bulan</p><p class="text-xs text-emerald-700 mt-1">Listrik: ${fmt(c.kwh*.87)} kg · Gas: ${fmt(num(data.otherCarbon.gas)*2)} kg · Transportasi: ${fmt(num(data.otherCarbon.transport)*.21)} kg</p></div>`,parent);
    $('carbonForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);data.otherCarbon={gas:num(f.get('gas')),transport:num(f.get('transport'))};save();location.reload();});
  }
  function renderSolar() {
    const form=document.querySelector('main form'); if(!form)return;
    const inputs=form.querySelectorAll('input'); if(inputs.length>=3){inputs[0].id='solarUsage';inputs[1].id='solarTariff';inputs[2].id='solarHours';inputs[0].value=data.solar.usage;inputs[1].value=data.solar.tariff;inputs[2].value=data.solar.sunHours;}
    const selects=form.querySelectorAll('select'); if(selects[0]){selects[0].id='solarRoof';selects[0].value=data.solar.roof;} if(selects[1]){selects[1].id='solarSystem';selects[1].value=data.solar.system;}
    let out=$('solarResult'); if(!out){out=document.createElement('div');out.id='solarResult';out.className='rounded-2xl bg-emerald-50 p-4 mt-4';form.appendChild(out);}
    const calculate=()=>{const usage=num($('solarUsage')?.value),tariff=num($('solarTariff')?.value),sun=Math.max(.1,num($('solarHours')?.value)),system=$('solarSystem')?.value||'On-grid';const kwp=Math.max(0,usage/30/(sun*.75));const install=kwp*15000000;const production=kwp*sun*.75*30;const saving=Math.min(usage,production)*tariff*(system==='Off-grid'?.85:1);const payback=saving>0?install/saving:0;out.innerHTML=`<h3 class="font-bold text-emerald-900">Hasil estimasi panel surya</h3><p class="text-sm mt-2">Kapasitas rekomendasi: <b>${fmt(kwp,2)} kWp</b></p><p class="text-sm">Produksi: <b>${fmt(production)} kWh/bulan</b></p><p class="text-sm">Potensi hemat: <b>${money(saving)}/bulan</b></p><p class="text-sm">Biaya awal indikatif: <b>${money(install)}</b></p><p class="text-sm">Balik modal indikatif: <b>${payback?fmt(payback/12,1)+' tahun':'—'}</b></p><p class="text-xs text-emerald-700 mt-2">Rumus: produksi = kWp × jam matahari × 0,75 × 30; biaya awal diasumsikan Rp15 juta/kWp. Ini estimasi kasar, bukan penawaran pemasangan.</p>`;};
    form.addEventListener('submit',e=>e.preventDefault());form.querySelector('button')?.addEventListener('click',e=>{e.preventDefault();data.solar={usage:num($('solarUsage').value),tariff:num($('solarTariff').value),sunHours:num($('solarHours').value),roof:$('solarRoof')?.value||'Miring',system:$('solarSystem')?.value||'On-grid'};save();calculate();});['solarUsage','solarTariff','solarHours','solarRoof','solarSystem'].forEach(id=>$(id)?.addEventListener('input',calculate));calculate();
  }
  function renderSettings() {
    const name=document.querySelector('main h2'); const parent=document.querySelector('main')||document.body;
    const profileName=[...parent.querySelectorAll('h2')].find(x=>x.textContent.trim()==='Miaw Meo'); if(profileName)profileName.textContent=data.profile.name; const profileEmail=[...parent.querySelectorAll('p')].find(x=>x.textContent.includes('@warga.com')); if(profileEmail)profileEmail.textContent=data.profile.email;
    ensureSection('profileSettings','Profil & preferensi',`<form id="profileForm" class="space-y-3"><label class="block text-sm">Nama pengguna<input name="name" required value="${esc(data.profile.name)}" class="block w-full border rounded-xl p-3 mt-1"></label><label class="block text-sm">Email<input name="email" type="email" required value="${esc(data.profile.email)}" class="block w-full border rounded-xl p-3 mt-1"></label><label class="flex items-center gap-2 text-sm"><input type="checkbox" name="notifications" ${data.settings.notifications?'checked':''}> Aktifkan preferensi notifikasi</label><button class="bg-emerald-700 text-white font-bold rounded-xl px-5 py-3">Simpan pengaturan</button></form><button id="resetData" class="mt-3 text-red-600 text-sm font-bold">Reset seluruh data demo</button>`,parent);
    $('profileForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);data.profile={name:f.get('name'),email:f.get('email')};data.settings.notifications=f.has('notifications');localStorage.setItem('namaPengguna',data.profile.name);save();alert('Pengaturan tersimpan.');});
    $('resetData').addEventListener('click',()=>{if(confirm('Hapus data lokal dan kembalikan data demo?')){localStorage.removeItem(KEY);location.reload();}});
  }
  function renderHouseForm() {
    const f=$('formRumah'); if(!f)return;
    Object.entries({namaRumah:'nama',alamatRumah:'alamat',jenisRumah:'jenis',luasRumah:'luas',tahunRumah:'tahun',kamarTidur:'kamarTidur',kamarMandi:'kamarMandi',tarifKwh:'tarif'}).forEach(([id,key])=>{if($(id)&&data.house[key]!==undefined)$(id).value=data.house[key];});
    f.addEventListener('submit',e=>{e.preventDefault();data.house={nama:$('namaRumah').value.trim(),alamat:$('alamatRumah').value.trim(),jenis:$('jenisRumah').value,luas:num($('luasRumah').value)||100,tahun:num($('tahunRumah').value)||new Date().getFullYear(),kamarTidur:num($('kamarTidur').value)||0,kamarMandi:num($('kamarMandi').value)||0,tarif:num($('tarifKwh').value)||1444};save();location.href='dashboard.html';});
  }
  window.prosesLogin=function(){const u=$('username')?.value.trim(),p=$('password')?.value,teks=$('textTombol'),ikon=$('loadingIcon');if(!u||!p){alert('Harap isi Username dan Password!');return;}if(teks)teks.innerText='Memverifikasi...';ikon?.classList.remove('hidden');setTimeout(()=>{if((u==='warga_unikom'&&p==='warga123')||(u==='pak_rt'&&p==='rt123')){const name=u==='pak_rt'?'Pak RT':'Unikom1';localStorage.setItem('namaPengguna',name);data.profile.name=name;save();location.href=u==='pak_rt'?'dashboard_rt.html':'dashboard.html';}else{alert('Username atau password salah.');if(teks)teks.innerText='Masuk Sekarang';ikon?.classList.add('hidden');}},250);};
  window.prosesLogout=function(){localStorage.removeItem('namaPengguna');location.href='index.html';};
  document.addEventListener('DOMContentLoaded',()=>{
    const page=location.pathname.split('/').pop();
    const names=['analitik.html','dashboard.html','dashboard_rt.html','alat.html','pengaturan.html','kalkulator_surya.html','jejak_karbon.html','ruangan.html','tagihan.html','tambah_rumah.html'];
    if(names.includes(page)&&!localStorage.getItem('namaPengguna')) { /* halaman demo tetap bisa dibuka langsung */ }
    if(page==='dashboard.html')renderDashboard();
    if(page==='analitik.html')renderAnalytics();
    if(page==='alat.html'){
      // Jangan membuat bagian "Perangkat & Pemakaian" pada halaman Alat Energi.
      // Hapus juga jika elemen tersebut sudah ada di HTML.
      const deviceManager = $('deviceManager');
      if(deviceManager) deviceManager.remove();
    }
    if(page==='ruangan.html')renderRooms();
    if(page==='tagihan.html')renderBills();
    if(page==='jejak_karbon.html')renderCarbon();
    if(page==='kalkulator_surya.html')renderSolar();
    if(page==='pengaturan.html')renderSettings();
    if(page==='tambah_rumah.html')renderHouseForm();
    if(page==='dashboard_rt.html'){
      const h=document.querySelectorAll('main h3'),c=calc();if(h[0])h[0].innerHTML=`1 <span class="text-sm font-normal text-gray-500">KK demo</span>`;if(h[1])h[1].innerHTML=`${fmt(c.kwh)} <span class="text-sm font-normal text-gray-500">kWh</span>`;if(h[2])h[2].innerHTML=`${fmt(c.carbon)} <span class="text-sm font-normal text-gray-500">kg CO₂</span>`;
    }
  });
})();
