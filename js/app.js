function prosesLogin() {
    // Ambil yang diketik user
    let inputUser = document.getElementById("username").value;
    let inputPass = document.getElementById("password").value;
    
    let teks = document.getElementById("textTombol");
    let ikon = document.getElementById("loadingIcon");

    // Cek kolom kosong
    if(inputUser === "" || inputPass === "") {
        alert("Harap isi Username dan Password!");
        return; // Hentikan proses
    }

    // Animasi loading
    teks.innerText = "Memverifikasi...";
    ikon.classList.remove("hidden");

    // Logika Pengecekan Akun
    setTimeout(function() {
        if(inputUser === "warga_unikom" && inputPass === "warga123") {
            // Jika yang login Warga
            window.location.href = "dashboard.html";
            
        } else if (inputUser === "pak_rt" && inputPass === "rt123") {
            // Jika yang login Ketua RT
            window.location.href = "dashboard_rt.html";
            
        } else {
            // Jika password salah
            alert("Username atau Password salah! Coba lagi.");
            teks.innerText = "Masuk Sekarang";
            ikon.classList.add("hidden");
        }
    }, 1000);
}

function prosesLogout() {
    window.location.href = "index.html";
}
