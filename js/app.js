function app() {

    return {

        loading: false,

        isEdit: false,

        registrationClosed: false, // Menampung status buka/tutup pendaftaran

        progressText: '',

        photoPreview: null,

        kelompok: [],

        options: OPTIONS,

        config: {

            targetSheet: '',

            scriptUrl: "https://script.google.com/macros/s/AKfycby2o_XXEpjdh14jRQ3ScFWesbMGtAyN0hDCW00FO1u65EhHLTg-PpXlGXkrv57U4At0/exec"

        },

        formData: defaultFormData(),


        async init() {

            try {

                this.loading = true;

                this.progressText = 'Memeriksa status pendaftaran...';

                const response = await fetch(
                    this.config.scriptUrl + '?action=activeRegistration'
                );

                const result = await response.json();

                console.log(result);

                if (!result || result.status !== true) {

                    // JIKA TUTUP: Aktifkan layar penutup di HTML
                    this.registrationClosed = true;

                    return;

                }

                // JIKA BUKA: Set nama target sheet sesuai nama gelombang aktif
                this.registrationClosed = false;

                this.config.targetSheet = result.gelombang;

                console.log('Gelombang Aktif:', result.gelombang);

            } catch (err) {

                console.error(err);

                // Jika terjadi kegagalan koneksi, default-kan ke sistem tutup (aman)
                this.registrationClosed = true;

                showToast('Gagal memuat status pendaftaran terbaru', 'error');

            } finally {

                this.loading = false;

                this.progressText = '';

            }

        },


        async uploadPhoto(event) {

            try {

                const file = event.target.files[0];

                if (!file) return;

                const result = await handlePhotoUpload(file);

                this.photoPreview = result.preview;

                this.formData.pasFotoData = result.base64;

            } catch (err) {

                showToast(err, 'error');

            }

        },


        async uploadPdf(event) {

            try {

                const files = Array.from(event.target.files);

                this.formData.dokumenList = await handlePdfUpload(files);

                showToast("Dokumen berhasil dipilih");

            } catch (err) {

                showToast(err, 'error');

            }

        },


        validateTanggalLahir() {

            const valid = validateAge(this.formData.tanggalLahir);

            if (!valid) {

                this.formData.tanggalLahir = '';

            }

        },


        resetKelompok() {

            this.kelompok = [];

        },


        removeMhs(index) {

            this.kelompok.splice(index, 1);

        },


        validateDates() {

            const start = this.formData.startDate;

            const end = this.formData.endDate;

            if (!start || !end) return;

            const startDate = new Date(start);

            const endDate = new Date(end);

            if (endDate < startDate) {

                showToast(
                    "Tanggal selesai tidak boleh sebelum tanggal mulai",
                    'error'
                );

                this.formData.endDate = '';

                return;

            }

        },


        async handleSubmit() {

            try {

                this.loading = true;

                this.progressText = "Sedang mengirim data...";


                if (!this.options.universitas.includes(this.formData.namaInstitusi)) {

                    throw new Error("Pilih institusi dari daftar");

                }


                if (!this.options.jurusan.includes(this.formData.jurusan)) {

                    throw new Error("Pilih jurusan dari daftar");

                }


                const payload = {

                    ...this.formData,

                    targetSheet: this.config.targetSheet,

                    action: this.isEdit ? "edit" : "insert"

                };


                await sendToAppsScript(this.config.scriptUrl, payload);


                showToast(
                    this.isEdit ? "Data berhasil diperbarui" : "Data berhasil dikirim"
                );


                this.formData = defaultFormData();

                this.photoPreview = null;


                setTimeout(() => {
                    this.formData = defaultFormData();
                    this.photoPreview = null;
                    sessionStorage.removeItem('peserta_' + this.config.targetSheet);
                    
                    // DIUBAH KE SINI: Mengarah kembali ke index.html
                    window.location.href = '../index.html'; 
                }, 1200);

            } catch (err) {

                console.error(err);

                showToast(err.message, 'error');

            } finally {

                this.loading = false;

                this.progressText = '';

            }

        }

    }

}