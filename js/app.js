function prosesLogin() {
    let teks = document.getElementById("textTombol");
    let ikon = document.getElementById("loadingIcon");

    teks.innerText = "Memverifikasi...";
    ikon.classList.remove("hidden");

    setTimeout(function() {
        window.location.href = "dashboard.html";
    }, 1000);
}

function prosesLogout() {
    window.location.href = "index.html";
}
