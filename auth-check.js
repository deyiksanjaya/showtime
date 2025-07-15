// auth-check.js

(async () => {
  // Kunci yang akan kita gunakan untuk menyimpan status akses di localStorage
  const ACCESS_KEY = 'appAccessGranted';

  // Dapatkan URLSearchParams untuk membaca parameter dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const licenseKey = urlParams.get('license_key');

  // Fungsi untuk redirect ke halaman utama
  const redirectToHome = () => {
    // Menggunakan replace agar pengguna tidak bisa menekan tombol "back" untuk kembali
    window.location.replace('/index.html'); 
  };

  // --- ALUR UTAMA ---

  // 1. Jika ada parameter license_key di URL
  if (licenseKey) {
    try {
      // Membuat referensi ke path spesifik di Realtime Database
      const dbRef = db.ref('license_keys/' + licenseKey);
      
      // Mengambil data sekali dari referensi tersebut
      const snapshot = await dbRef.once('value');
      const data = snapshot.val(); // Mengambil nilai dari snapshot

      // Cek apakah data ada (tidak null) dan properti isActive bernilai true
      if (data && data.isActive === true) {
        console.log("License key is valid. Access granted.");
        // Simpan status akses ke localStorage. Ini akan persist di browser & PWA.
        localStorage.setItem(ACCESS_KEY, 'true');
        
        // (Opsional tapi direkomendasikan) Hapus parameter dari URL agar bersih
        history.replaceState(null, '', window.location.pathname);
        
      } else {
        console.log("License key is invalid or inactive.");
        redirectToHome();
      }
    } catch (error) {
      console.error("Error verifying license key:", error);
      redirectToHome();
    }
  } 
  // 2. Jika tidak ada parameter license_key, cek localStorage
  else {
    const isAccessGranted = localStorage.getItem(ACCESS_KEY);

    if (isAccessGranted === 'true') {
      console.log("Access already granted from this device.");
      // Jika sudah ada izin, biarkan halaman termuat
    } else {
      console.log("No license key in URL and no access granted. Redirecting...");
      // Jika tidak ada izin sama sekali, lempar ke halaman utama
      redirectToHome();
    }
  }
})();
