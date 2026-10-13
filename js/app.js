function prosesLogin() {
    let inputUser = document.getElementById("username").value;
    let inputPass = document.getElementById("password").value;
    let teks = document.getElementById("textTombol");
    let ikon = document.getElementById("loadingIcon");

    if(inputUser === "" || inputPass === "") {
        alert("Harap isi Username dan Password!");
        return; 
    }

    teks.innerText = "Memverifikasi...";
    ikon.classList.remove("hidden");

    setTimeout(function() {
        if(inputUser === "warga_unikom" && inputPass === "warga123") {
            localStorage.setItem("namaPengguna", "Unikom1");
            window.location.href = "dashboard.html";
        } else if (inputUser === "pak_rt" && inputPass === "rt123") {
            localStorage.setItem("namaPengguna", "Pak RT");
            window.location.href = "dashboard_rt.html";
        } else {
            alert("Username atau Password salah! Coba lagi.");
            teks.innerText = "Masuk Sekarang";
            ikon.classList.add("hidden");
        }
    }, 1000);
}

function prosesLogout() {
    localStorage.removeItem("namaPengguna");
    window.location.href = "index.html";
}

window.addEventListener("DOMContentLoaded", function() {
    let nama = localStorage.getItem("namaPengguna");
    let elemenSapa = document.getElementById("sapaanUser");
    if(nama && elemenSapa) {
        elemenSapa.innerText = "Hai, " + nama + "!";
    }
});
