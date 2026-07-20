function app() {
    return {
        // State Management
        loading: false,
        isEdit: false,
        registrationClosed: false,
        progressText: '',
        photoPreview: null,
        options: OPTIONS,
        
        // Configuration
        config: {
            targetSheet: '',
            scriptUrl: "https://script.google.com/macros/s/AKfycby2o_XXEpjdh14jRQ3ScFWesbMGtAyN0hDCW00FO1u65EhHLTg-PpXlGXkrv57U4At0/exec"
        },
        
        // Form Data
        formData: defaultFormData(),

        /**
         * Inisialisasi Aplikasi & Cek Status Pendaftaran
         */
        async init() {
            try {
                this.loading = true;
                this.progressText = 'Memeriksa status pendaftaran...';

                // 1. Ambil status registrasi aktif seperti biasa
                const response = await fetch(`${this.config.scriptUrl}?action=activeRegistration`);
                const result = await response.json();

                if (!result || result.status !== true) {
                    this.registrationClosed = true;
                    return;
                }

                this.registrationClosed = false;
                this.config.targetSheet = result.gelombang;

                // 2. DETEKSI MODE EDIT DARI URL (Aksi Klik Kanan / Admin)
                const urlParams = new URLSearchParams(window.location.search);
                const actionParam = urlParams.get('action');
                const nimParam = urlParams.get('nim');

                if (actionParam === 'edit' && nimParam) {
                    this.formData.nim = nimParam; // Set nilai NIM ke Form
                    
                    this.progressText = 'Memuat data peserta otomatis...';
                    
                    if (typeof this.checkNimOtomatis === 'function') {
                        // Jalankan pengecekan data ke server
                        await this.checkNimOtomatis();
                    }
                    
                    // --- STRATEGI KUNCI MODE EDIT ADMIN ---
                    // Dipaksa menjadi TRUE di akhir agar menimpa apa pun isi result.mode dari server!
                    this.isEdit = true; 
                    
                }

            } catch (err) {
                console.error('Error init:', err);
                if (!this.isEdit) {
                    this.registrationClosed = true; 
                }
                showToast('Gagal memuat status pendaftaran', 'error');
            } finally {
                this.loading = false;
                this.progressText = '';
            }
        },

        /**
    
         * Handler Upload Pas Foto Berbasis Base64
         */
        async uploadPhoto(event) {
            try {
                const file = event.target.files[0];
                if (!file) return;

                const result = await handlePhotoUpload(file);
                this.photoPreview = result.preview;
                
                // SINKRONISASI: Simpan langsung ke properti pasFotoData
                this.formData.pasFotoData = result.base64;
            } catch (err) {
                showToast(err, 'error');
            }
        },

        /**
         * Handler Upload Berkas Pendukung PDF
         */
        async uploadPdf(event) {
            try {
                const files = Array.from(event.target.files);
                this.formData.dokumenList = await handlePdfUpload(files);
                showToast("Dokumen berhasil dipilih");
            } catch (err) {
                showToast(err, 'error');
            }
        },

        /**
         * Validasi Nomor WhatsApp Mandiri
         */
        validatePhoneNumber() {
            // Paksa nilai hp menjadi string terlebih dahulu menggunakan .toString() sebelum di-trim()
            const phoneValue = this.formData.hp ? this.formData.hp.toString().trim() : '';
            if (!phoneValue) return true;

            // Regex: Mendukung awalan 0 atau +62, diikuti digit angka operator (8xx), total panjang 10-15 digit
            const phoneRegex = /^(0|\+62)8[1-9][0-9]{7,11}$/;

            if (!phoneRegex.test(phoneValue)) {
                showToast("Nomor telepon tidak valid! Wajib diawali 0 atau +62", 'error');
                this.formData.hp = ''; // Reset input field jika tidak valid
                return false;
            }
            
            // Simpan kembali nilai yang sudah bersih dalam bentuk string ke form data
            this.formData.hp = phoneValue; 
            return true;
        },
        
        /**
         * Validasi Batas Usia Minimal/Maksimal
         */
        validateTanggalLahir() {
            const valid = validateAge(this.formData.tanggalLahir);
            if (!valid) {
                this.formData.tanggalLahir = '';
            }
        },

        /**
         * Validasi Nomor WhatsApp Mandiri
         */
        validatePhoneNumber() {
            let phoneValue = this.formData.hp ? this.formData.hp.toString().trim() : '';
            if (!phoneValue) return true;

            // Pengaman tambahan: Jika user mengetik langsung angka 8, otomatis bantu tambahkan 0
            if (phoneValue.startsWith('8')) {
                phoneValue = '0' + phoneValue;
                this.formData.hp = phoneValue;
            }

            // Regex: Mendukung awalan 0 atau +62, diikuti digit angka operator (8xx), total panjang 10-15 digit
            const phoneRegex = /^(0|\+62)8[1-9][0-9]{7,11}$/;

            if (!phoneRegex.test(phoneValue)) {
                showToast("Nomor telepon tidak valid! Wajib diawali 0 atau +62", 'error');
                // DIHAPUS: baris 'this.formData.hp = ""' dibuang agar input user tidak hilang!
                return false;
            }
            
            return true;
        },


       /**
         * Pengecekan NIM Otomatis saat berpindah field input (on blur)
         */
        async checkNimOtomatis() {
            const nimValue = this.formData.nim ? this.formData.nim.trim() : '';
            if (!nimValue) return;

            try {
                this.loading = true;
                this.progressText = 'Memeriksa nomor induk pendaftar...';

                const response = await fetch(`${this.config.scriptUrl}?action=getByNim&nim=${encodeURIComponent(nimValue)}`);
                const result = await response.json();

                if (result && result.status === 'SUCCESS' && result.data) {
                    const d = result.data;
                    
                    console.log("=== DATA UTUH SINKRON ===", d);

                    // Deteksi apakah pemanggilan ini berasal dari URL Klik Kanan Admin
                    const urlParams = new URLSearchParams(window.location.search);
                    const isFromAdminEdit = urlParams.get('action') === 'edit';

                    if (isFromAdminEdit) {
                        // Jika dari klik kanan, mode murni EDIT tanpa merubah konfigurasi gelombang asal
                        this.isEdit = true;
                    } else {
                        // Jalur ketik manual di formulir pendaftaran
                        if (result.mode === 'EDIT') {
                            showToast('Data Anda ditemukan di gelombang ini. Mengaktifkan mode koreksi/edit data.', 'info');
                            this.isEdit = true;
                        } else if (result.mode === 'BARU_RIWAYAT') {
                            showToast('Selamat datang kembali! Data lama Anda ditemukan. Form otomatis terisi.', 'success');
                            this.isEdit = false;
                        }
                    }

                    // --- I. AUTO-FILL DATA INSTITUSI & KEGIATAN ---
                    this.formData.rowIndex = d.rowIndex || d.row || -1;
                    this.formData.bagian = d.bagian || ''; 
                    this.formData.jenis = d.jenis || ''; 
                    this.formData.jenjangPendidikan = d.jenjangPendidikan || '';
                    this.formData.namaInstitusi = d.namaInstitusi || '';
                    this.formData.jurusan = d.jurusan || '';
                    this.formData.kotaInstitusi = d.kotaInstitusi || ''; 
                    
                    // Format tanggal disesuaikan aman ke HTML5 input date (YYYY-MM-DD)
                    this.formData.startDate = d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '';
                    this.formData.endDate = d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '';
                    this.formData.tanggalLahir = d.tanggalLahir ? new Date(d.tanggalLahir).toISOString().split('T')[0] : '';

                    // --- II. AUTO-FILL BIODATA PERORANGAN ---
                    this.formData.nama = d.nama || '';
                    this.formData.ktp = d.ktp || '';
                    this.formData.agama = d.agama || '';
                    this.formData.jenisKelamin = d.jenisKelamin || ''; 
                    // --- AUTO-FILL NOMOR HP (PENGAMAN ANGKA 0 KILANG DI GOOGLE SHEETS) ---
                    let serverHp = d.hp ? d.hp.toString().trim() : '';
                    if (serverHp && serverHp.startsWith('8')) {
                        serverHp = '0' + serverHp; 
                    }
                    this.formData.hp = serverHp;
                    this.formData.tempatLahir = d.tempatLahir || '';
                    this.formData.alamat = d.alamat || '';
                    this.formData.kelurahanKecamatan = d.kelurahanKecamatan || ''; 
                    
                    this.formData.catatanRiwayat = d.catatanRiwayat || '';
                    
                    // --- III. DIRECT LOAD PAS FOTO (BASE64) ---
                    this.photoPreview = d.pasFotoPreview || null;
                    this.formData.fotoLamaUrl = d.pasFoto || '';
                    this.formData.adaDokumenLama = d.uploadDokumen || d.UploadDokumen || true;

                } else {
                    console.log('NIM baru, silakan lanjutkan pendaftaran.');
                }

            } catch (err) {
                console.error('Error saat cek NIM:', err);
                showToast('Gagal memproses verifikasi NIM', 'error');
            } finally {
                this.loading = false;
                this.progressText = '';
            }
        },
        
        resetFormData() {
            // Kembalikan form ke setelan awal kosong
            this.formData = defaultFormData();
            this.photoPreview = null;
            this.isEdit = false;
            
            // Bersihkan parameter ?action=edit&nim=... dari URL browser tanpa reload halaman
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            
            showToast("Formulir berhasil direset ke mode pendaftaran baru.");
        },

        /**
         * Validasi Rentang Tanggal Mulai dan Selesai
         */
        validateDates() {
            const start = this.formData.startDate;
            const end = this.formData.endDate;

            // Jika salah satu tanggal belum diisi, abaikan validasi terlebih dahulu
            if (!start || !end) return true;

            const startTime = new Date(start).getTime();
            const endTime = new Date(end).getTime();

            // Pengecekan jika tanggal selesai mendahului tanggal mulai
            if (endTime < startTime) {
                showToast("Tanggal Selesai tidak boleh sebelum Tanggal Mulai!", "error");
                this.formData.endDate = ""; // Reset otomatis kolom tanggal selesai yang salah
                return false;
            }
            return true;
        },

        /**
         * Submit Payload Pendaftaran ke Google Apps Script
         */
        async handleSubmit() {
            try {
                this.loading = true;
                this.progressText = "Sedang mengirim data...";

                // --- 1. VALIDASI FOTO & DOKUMEN ---
                if (!this.formData.pasFoto && !this.photoPreview) {
                    throw new Error("Pasfoto wajib diunggah!");
                }

                const mempunyaiDokumenBaru = this.formData.dokumenList && this.formData.dokumenList.length > 0;
                
                if (!mempunyaiDokumenBaru && !this.formData.adaDokumenLama) {
                    throw new Error("Dokumen pendaftaran wajib diunggah!");
                }

                // --- 2. VALIDASI INPUT DATA ---
                if (!this.validatePhoneNumber()) {
                    throw new Error("Nomor WhatsApp belum valid");
                }

                if (!this.options.universitas.includes(this.formData.namaInstitusi)) {
                    throw new Error("Pilih institusi dari daftar yang tersedia");
                }

                if (!this.options.jurusan.includes(this.formData.jurusan)) {
                    throw new Error("Pilih jurusan dari daftar yang tersedia");
                }

                // --- 3. INISIALISASI PAYLOAD DASAR ---
                    const payload = {
                        ...this.formData,
                        targetSheet: this.config.targetSheet,
                        action: "submitData",
                        rowIndex: this.formData.rowIndex || this.formData.row || -1 
                    };

                    // --- LOGIKA PENGAMAN PAS FOTO ---
                    if (!this.formData.pasFotoData && this.photoPreview) {
                        // Jika tidak ada file baru yang diupload, tapi preview foto ada (berarti foto lama dari database)
                        payload.pasFotoData = "KEEP_OLD";
                    } else if (this.formData.pasFotoData) {
                        // Jika ada file baru yang diupload, kirim string base64-nya
                        payload.pasFotoData = this.formData.pasFotoData;
                    } else {
                        // Jika tidak ada foto sama sekali
                        payload.pasFotoData = "";
                    }

                // Pengaman Dokumen Pendukung
                if (!mempunyaiDokumenBaru && this.formData.adaDokumenLama) {
                    payload.dokumenList = "KEEP_OLD";
                }

                // --- 5. PROSES KIRIM ---
                await sendToAppsScript(this.config.scriptUrl, payload);

                showToast(this.isEdit ? "Data berhasil diperbarui" : "Data berhasil dikirim");

                // Eksekusi pembersihan state & redirect
                setTimeout(() => {
                    this.formData = defaultFormData();
                    this.photoPreview = null;
                    sessionStorage.removeItem('peserta_' + this.config.targetSheet);
                    window.location.href = '../index.html'; 
                }, 1200);

            } catch (err) {
                console.error('Error submit:', err);
                showToast(err.message, 'error');
            } finally {
                this.loading = false;
                this.progressText = '';
            }
        }



    }
}
