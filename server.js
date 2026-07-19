const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/analisis-protein', async (req, res) => {
    const { weight, height, activity, targetProtein } = req.body;

    if (!weight || !height || !targetProtein) {
        return res.status(400).json({ error: 'Data fisik tidak lengkap.' });
    }

    // Mengajarkan AI cara menghitung BMI & menentukan kategori tubuh yang akurat sebelum menjawab
    const promptText = `Anda adalah asisten AI pemantau nutrisi harian yang praktis, logis, jujur, dan akurat secara matematis. Gunakan bahasa sehari-hari yang mudah dipahami orang awam.

    Data input fisik pengguna:
    - Berat Badan: ${weight} kg
    - Tinggi Badan: ${height} cm
    - Level Aktivitas: ${activity}
    - Target Protein Dasar: ${targetProtein} gram.

    TUGAS UTAMA (Analisis Klasifikasi Tubuh Akurat):
    1. Hitung BMI (Indeks Massa Tubuh) secara presisi dengan rumus: Berat (kg) / (Tinggi (m) x Tinggi (m)).
       *Contoh kasus: Berat 100 kg dan Tinggi 160 cm (1.6 m) memiliki BMI = 100 / 2.56 = 39.06. Ini adalah kategori OBESITAS EKSTREM. Jangan pernah menyebutnya normal atau menyembunyikan status ini.*
    2. Tentukan status tubuh berdasarkan standar klasifikasi BMI Asia-Pasifik:
       - BMI < 18.5: Kurus (Underweight)
       - BMI 18.5 - 22.9: Ideal / Normal
       - BMI 23.0 - 24.9: Kelebihan Berat Badan Ringan (Overweight)
       - BMI >= 25.0: Obesitas (Obese)
    
    Patuhi aturan respon berdasarkan kondisi berikut:
    
    Kondisi A (DATA TIDAK MASUK AKAL):
    Jika data tidak realistis bagi manusia hidup (misal berat sangat kecil seperti 10 kg tapi tinggi 150 cm), langsung ingatkan dengan sopan bahwa angka proporsi ini tidak logis atau kemungkinan ada salah input data (typo).

    Kondisi B (DATA REALISTIS):
    Jika data logis, sampaikan status tubuh hasil hitungan BMI di atas secara jujur dan suportif (apakah mereka Kurus, Normal, Overweight, atau Obesitas). 

    Berikan jawaban langsung fokus pada 2 poin ini (singkat, padat, dan to-the-point):
    1. **Status Tubuh & Kenapa target protein ini pas?** Sebutkan hasil kategori tubuhnya secara spesifik (Kurus/Normal/Overweight/Obesitas). Jelaskan dalam 1-2 kalimat pendek hubungan target ${targetProtein} gram dengan berat badan ${weight} kg mereka agar membantu mencapai kondisi tubuh yang lebih sehat dan ideal.
    2. **Contoh Menu Praktis:** Berikan daftar poin (bullet points) kombinasi makanan lokal sederhana (seperti telur, tahu, tempe, dada ayam dll dengan 3 kali makan perhari) untuk mencapai sekitar ${targetProtein} gram beserta porsi ringkasnya.
    *Peringatan Keras: Pastikan jika total gram protein dari seluruh menu yang Anda sebutkan di bawah ini dijumlahkan, hasilnya HARUS mendekati atau pas dengan target ${targetProtein} gram. Jangan memberikan total menu yang melebihi target tersebut dan gunakan kandungan gizi dari sumber makanan lokal yang umum dan sesuai referensi nyata dan fakta, dan pastikan porsi realistis..*

    Wajib gunakan format persis seperti ini:
    * **Sarapan:** [Nama makanan & porsi jelas] ([X] gram protein)
    * **Makan Siang:** [Nama makanan & porsi jelas] ([Y] gram protein)
    * **Makan Malam:** [Nama makanan & porsi jelas] ([Z] gram protein)
    **Total Akumulasi Protein:** [Hasil X + Y + Z] gram.
    Dilarang keras membuat menu yang melebihi target lalu menyuruh pengguna menyesuaikannya sendiri dan wajib mendekati jangan dilebihkan!

    Aturan Mutlak:
    - Posisikan diri HANYA sebagai teman belajar/asisten digital, BUKAN dokter atau ahli gizi resmi.
    - Di baris paling akhir, beri catatan 1 kalimat pendek saja: "Catatan: Saya hanyalah AI yang bisa keliru, jika ada keluhan fisik atau pencernaan wajib konsultasi ke dokter."`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", 
                messages: [
                    { role: "user", content: promptText }
                ],
                temperature: 0.3 // Diturunkan lagi ke 0.3 agar AI lebih patuh pada aturan logika matematika kalkulasi BMI
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            res.json({ result: data.choices[0].message.content });
        } else {
            console.error("====== EROR DARI RESPONS GROQ ======");
            console.error(JSON.stringify(data, null, 2));
            console.error("====================================");
            
            const detailEror = data.error?.message || 'Struktur respons tidak dikenal.';
            res.status(500).json({ error: `Eror dari Groq: ${detailEror}` });
        }
    } catch (error) {
        console.error('Error Jaringan/Server:', error);
        res.status(500).json({ error: 'Terjadi gangguan koneksi pada server lokal.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan lancar di http://localhost:${PORT}`);
});