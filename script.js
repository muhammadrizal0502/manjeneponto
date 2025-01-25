
const guestForm = document.getElementById('guestForm');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const guestTable = document.getElementById('guestTable').querySelector('tbody');
const downloadReport = document.getElementById('downloadReport');
const guests = JSON.parse(localStorage.getItem('guests')) || [];

// Menampilkan bagian tertentu
function showSection(section) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(section).style.display = 'block';
}

// Menjalankan webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Error accessing webcam: ", err);
    });

// Menangkap foto
document.getElementById('capture').addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
});

// Menyimpan data tamu
guestForm.addEventListener('submit', event => {
    event.preventDefault();

    const newGuest = {
        fullName: event.target.fullName.value,
        address: event.target.address.value,
        phone: event.target.phone.value,
        visitPurpose: event.target.visitPurpose.value,
        visitCategory: event.target.visitCategory.value,
        visitTime: new Date().toLocaleString(),
        photo: canvas.toDataURL('image/png') // Simpan foto sebagai Data URI
    };

    guests.push(newGuest);
    localStorage.setItem('guests', JSON.stringify(guests));
    alert("Data tamu berhasil disimpan!");
    guestForm.reset();
    updateGuestTable();
});

// Mengisi tabel data tamu
function updateGuestTable() {
    guestTable.innerHTML = '';
    guests.forEach((guest, index) => {
        const row = guestTable.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${guest.fullName}</td>
            <td>${guest.address}</td>
            <td>${guest.phone}</td>
            <td>${guest.visitPurpose}</td>
            <td>${guest.visitCategory}</td>
            <td>${guest.visitTime}</td>
            <td><img src="${guest.photo}" alt="Foto" style="width: 100px;"></td>
        `;
    });
}

// Memperbarui tabel saat halaman dimuat
updateGuestTable();

// Mengunduh laporan PDF
downloadReport.addEventListener('click', async () => {
    const month = document.getElementById('month').value.trim();
    if (!month) {
        alert("Masukkan bulan terlebih dahulu!");
        return;
    }

    const filteredGuests = guests.filter(guest => {
        const guestMonth = new Date(guest.visitTime).toLocaleString("id-ID", { month: "long" });
        return guestMonth.toLowerCase() === month.toLowerCase();
    });

    if (filteredGuests.length === 0) {
        alert(`Tidak ada data tamu untuk bulan ${month}!`);
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");

    // Header laporan
    doc.setFontSize(16);
    doc.text(`Laporan Tamu Bulan ${month}`, 10, 10);

    // Tambahkan tabel
    let startY = 20
doc.autoTable({
    head: [["No", "Nama", "Alamat", "Nomor HP", "Tujuan", "Kategori", "Tanggal", "Foto"]],
    body: filteredGuests.map((guest, index) => [
        index + 1,
        guest.fullName,
        guest.address,
        guest.phone,
        guest.visitPurpose,
        guest.visitCategory,
        guest.visitTime,
        "" // Placeholder untuk gambar
    ]),
    startY,
    styles: {
        minCellHeight: 20, // Menambah tinggi minimum sel
valign: 'middle',
    },
    columnStyles: {
        7: { cellWidth: 30 }, // Menyesuaikan lebar kolom Foto
    },
    didDrawCell: (data) => {
        // Tambahkan gambar ke kolom Foto
        if (data.column.index === 7 && data.cell.section === 'body') {
            const guestIndex = data.row.index;
            const img = filteredGuests[guestIndex].photo;
            if (img) {
                const cellPos = data.cell;
                const x = cellPos.x; // Menambah offset horizontal untuk gambar
                const y = cellPos.y; // Menambah offset vertikal untuk gambar
                const width = 15; // Lebar gambar
                const height = 20; // Tinggi gambar
                doc.addImage(img, 'PNG', x, y, width, height);
            }
        }
    }
});

    // Simpan file PDF
    doc.save(`Laporan_${month}.pdf`);
});
