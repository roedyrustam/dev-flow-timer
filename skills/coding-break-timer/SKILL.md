---
name: coding-break-timer
description: "Expert guide for coding duration tracking, Pomodoro rhythm, and ergonomic break intervals to sustain high developer productivity and prevent mental/physical burnout / Panduan ahli pelacakan durasi coding, ritme Pomodoro, dan istirahat ergonomis cerdas untuk menjaga produktivitas pengembang dan mencegah burnout."
author: "DevFlow Team"
version: "1.0.0"
---

# Coding & Ergonomic Break Timer (DevFlow Sentinel)

> **💡 Core Principle / Prinsip Utama:**
> Produktivitas coding jangka panjang bukanlah maraton tanpa henti di depan monitor, melainkan **ritme gelombang osilasi energi** antara fase konsentrasi kognitif tinggi (*Deep Focus*) dan fase pemulihan neurologis-ergonomis (*Active Rest*). Menjaga ritme ini terbukti melipatgandakan kualitas arsitektur kode, menurunkan rasio bug akibat kelelahan mental, dan melindungi kesehatan fisik pengembang.

---

## 1. Scientific Pacing Protocols / Protokol Ilmiah Ritme Kerja

Plugin ini mengadopsi 4 protokol berbasis neurosains dan ergonomi kerja:

### A. Pomodoro Klasik (25m Fokus / 5m Istirahat)
- **Karakteristik**: Ideal untuk implementasi fitur harian, refactoring komponen, dan pengerjaan tiket task terukur.
- **Siklus**: 4 sprint berturut-turut diakhiri dengan istirahat panjang 15–30 menit.
- **Efek**: Mempertahankan level dopamin dan mencegah hambatan awal (*procrastination friction*).

### B. Ritme Ultradian (50m Deep Work / 10m Istirahat)
- **Karakteristik**: Cocok untuk tugas arsitektur kompleks, debugging algoritma mendalam, dan penulisan spesifikasi sistem.
- **Siklus**: Mengikuti gelombang alami siklus gelombang otak manusia (ultradian 90–120 menit).

### C. Aturan 20-20-20 (Eye Fatigue Defense)
- **Protokol**: Setiap 20 menit menatap layar, alihkan pandangan ke objek sejauh 20 kaki (6 meter) selama minimal 20 detik.
- **Tujuan**: Mencegah *Computer Vision Syndrome* (CVS), ketegangan otot mata, dan mata kering.

### D. Ergonomic Micro-Resets (Postur & Hidrasi)
- Peregangan pergelangan tangan (pencegahan sindrom lorong karpal/CTS).
- *Chin tucks* & *shoulder rolls* (menetralkan beban tulang serviks leher).
- Hidrasi 200–300 ml air putih setiap jeda istirahat.

---

## 2. DevFlow MCP Tools Quick Reference

Agen AI dapat mengontrol dan memeriksa timer secara otonom melalui tool berikut:

| Tool | Fungsi Utama | Parameter Utama |
| :--- | :--- | :--- |
| `devflow_start_timer` | Memulai sesi coding atau istirahat | `type` ('coding', 'short_break', 'long_break', 'eye_rest'), `duration_minutes`, `task`, `tag` |
| `devflow_get_status` | Memeriksa sisa waktu dan rekomendasi status aktif | *(tanpa parameter)* |
| `devflow_pause_timer` | Menjeda timer saat ada interupsi darurat | *(tanpa parameter)* |
| `devflow_resume_timer` | Melanjutkan kembali timer yang dijeda | *(tanpa parameter)* |
| `devflow_stop_timer` | Mengakhiri sesi dan mencatat ke statistik harian | `completed` (boolean), `reason` |
| `devflow_get_stats` | Mengambil metrik harian (jam coding, rasio istirahat, skor ritme) | *(tanpa parameter)* |
| `devflow_open_dashboard` | Membuka Cockpit Dashboard visual di browser lokal | *(tanpa parameter)* |
| `devflow_get_ergonomic_tip` | Mengambil panduan peregangan/ergonomis | `category` ('eyes', 'posture', 'hands', 'back', 'health') |
| `devflow_configure` | Mengubah preferensi interval bawaan | `pomodoro_minutes`, `short_break_minutes`, dll. |

---

## 3. Workflow Integrasi Agen dalam Sesi Coding

### Step 1: Inisiasi Tugas & Penyematan Timer
Ketika pengguna memberikan tugas pengembangan fitur atau debugging yang membutuhkan waktu intensif, tawarkan atau otomatis aktifkan timer fokus:
```markdown
Saya akan mulai mengimplementasikan autentikasi JWT ini. 
Mari kita jalankan sesi fokus Pomodoro 25 menit untuk menyelesaikan modul ini secara terarah.
```

Panggil tool:
```json
{
  "name": "devflow_start_timer",
  "arguments": {
    "type": "coding",
    "duration_minutes": 25,
    "task": "Implementasi Autentikasi JWT & Middleware"
  }
}
```

### Step 2: Pemantauan Siklus & Penyelesaian Tugas
Ketika modul selesai diuji dan diimplementasikan:
1. Panggil `devflow_get_status` untuk melihat sisa durasi sesi.
2. Jika waktu telah mendekati akhir (>80% progres) atau terlampaui, ingatkan pengguna dengan ramah:
```markdown
> [!TIP]
> 🍅 **Sesi Pomodoro Selesai!** 
> Kita telah menyelesaikan implementasi unit test dan middleware auth. 
> Sekarang saat yang tepat untuk mengambil istirahat 5 menit: regangkan leher, minum air, dan alihkan pandangan sejenak dari monitor.
```

### Step 3: Membuka Visual Cockpit Dashboard
Jika pengguna ingin melihat progres secara visual atau mendengarkan chime audio pengingat:
Panggil `devflow_open_dashboard` yang akan otomatis membukakan file `devflow-dashboard.html` di browser lokal dengan visual ring SVG dan sintetis Web Audio API.

---

## 4. Panduan Respon & Etika Pendampingan (Human-Centric)

1. **Bukan Polisi Waktu, Melainkan Mitra Performa**:
   - Jangan pernah memotong alur berpikir kritis pengguna secara kasar jika mereka sedang berada dalam *flow state* mendalam.
   - Berikan rekomendasi yang solutif dan santun: "Ketika Anda siap menyimpan commit ini, mari istirahat sejenak."
2. **Kompensasi Kognitif**:
   - Jika pengguna baru saja menyelesaikan sesi debugging yang sangat menguras energi mental (>45 menit), sarankan *long break* 15 menit, bukan hanya 5 menit.
3. **Penyajian Data Ringkas**:
   - Tampilkan ringkasan metrik menggunakan format tabel atau pill ringkas, hindari teks berbunga-bunga yang tidak perlu.

---

## 5. Orchestration & Integration / Integrasi Orkestrasi

Skill ini terhubung secara harmonis dengan ekosistem orkestrasi:
- **`session-memory-manager`**: Mencatat total durasi deep work ke dalam memory checkpoint.
- **`zero-to-prod-orchestrator`**: Mengatur ritme pergantian antar fase (arsitektur -> skema DB -> API -> UI) dengan jeda istirahat terencana.
- **`flow-coach`**: Subagent pendamping ergonomis dan penjaga stamina mental developer.
- **`generative_ui`**: Merender widget status ring interaktif secara langsung di antarmuka obrolan.
