const documentList = [
  { id: 35, name: 'Surat pemberitahuan kedatangan kapal TUGBOAT' },
  { id: 36, name: 'Surat pemberitahuan kedatangan kapal TONGKANG' },
  { id: 71, name: 'Dok. Cargo Manifest' },
  { id: 90, name: 'Dok. BMBB Muat' },
  { id: 66, name: 'Bukti Penerimaan Negara / Faktur Bukti Bayar (Royalti provisional batubara)' },
  { id: 43, name: 'Dok. LHV' },
  { id: 61, name: 'Dok. Bill of Loading' },
  { id: 65, name: 'Provisional Report Of Draught Survey' },
  { id: 70, name: 'Surat persetujuan rencana pengoperasian kapal pada trayek tidak tetap dan tidak teratur angkutan laut dalam negeri' },
  { id: 69, name: 'Surat persetujuan berlayar' },
  { id: 55, name: 'Shipping instruction' }
];

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
      clearanceType: '',
      documentList,
    };
  },
  computed: {
    filteredDocumentList() {
      if (this.clearanceType === 'in') {
        return this.documentList;
      } else if (this.clearanceType === 'out') {
        return this.documentList.filter(doc => ![70, 69].includes(doc.id));
      }
      return [];
    }
  },
  watch: {
    clearanceType() {
      this.populateFileInputs();
    }
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
      if (this.clearanceType) {
        this.isMerging = true;
        try {
          const mergedPdf = await PDFLib.PDFDocument.create();

          for (const [index, doc] of this.filteredDocumentList.entries()) {
            const response = await fetch(`file_dummy/${index + 1}.pdf`);
            const arrayBuffer = await response.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          }

          const mergedPdfBytes = await mergedPdf.save();
          const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
          this.mergedPDF = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error merging PDFs:', error);
          alert('Terjadi kesalahan saat menggabungkan PDF.');
        } finally {
          this.isMerging = false;
        }
      } else {
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
          console.error('Error merging PDFs:', error);
          alert('Terjadi kesalahan saat menggabungkan PDF.');
        } finally {
          this.isMerging = false;
        }
      }
    },
    populateFileInputs() {
      this.fileInputs = this.filteredDocumentList.map((doc, index) => ({
        file: null,
        name: `file_dummy/${index + 1}.pdf`
      }));
    }
  }
});