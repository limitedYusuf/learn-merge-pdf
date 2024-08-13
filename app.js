if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

Vue.use(Toasted);

const app = new Vue({
  el: '#app',
  components: {
    draggable: vuedraggable
  },
  data() {
    return {
      fileInputs: [{ file: null, name: '' }],
      isMerging: false,
      mergedPDF: null,
    };
  },
  methods: {
    addFileInput() {
      this.fileInputs.push({ file: null, name: '' });
    },
    removeFileInput(index) {
      this.fileInputs.splice(index, 1);
    },
    onFileChange(event, index) {
      const file = event.target.files[0];
      if (file && file.type === 'application/pdf') {
        this.fileInputs[index].file = file;
        this.fileInputs[index].name = file.name;
      } else {
        alert('Hanya file PDF yang didukung.');
        event.target.value = null;
      }
    },
    onOrderChange() {
      this.$toasted.show('Posisi berhasil berubah', {
        position: 'top-right',
        duration: 3000,
      });
    },
    async mergePDFs() {
      if (this.fileInputs.some(input => !input.file)) {
        alert('Pastikan semua file PDF sudah diunggah.');
        return;
      }

      this.isMerging = true;

      try {
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (const fileInput of this.fileInputs) {
          const arrayBuffer = await fileInput.file.arrayBuffer();
          const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        this.mergedPDF = URL.createObjectURL(blob);
      } catch (error) {
        console.error('Error merging PDF =>', error);
        alert('Terjadi kesalahan saat menggabungkan PDF.');
      } finally {
        this.isMerging = false;
      }
    }
  }
});