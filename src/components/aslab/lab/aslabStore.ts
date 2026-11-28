import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSession } from '@/context/SessionContext';
import {
  LABS_SEED,
  type Keanggotaan,
  type Lab,
  type Sesi,
} from '@/data/dummy';
import {
  DEFAULT_DENDA_NOMINAL,
  DEFAULT_GRACE_MENIT,
  DEFAULT_JUMLAH_PERTEMUAN,
  DEFAULT_RADIUS_LAB,
} from './validasiManajemenLab';

const STORAGE_KEY_ASLAB = '@tapin_aslab_management_v1';

/** 0 = Minggu, 1 = Senin, ..., 5 = Jumat, 6 = Sabtu */
export type IndeksHari = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAFTAR_HARI_ID: Record<IndeksHari, string> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

export const DAFTAR_HARI_EN: Record<IndeksHari, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const HARI_AKTIF_KAMPUS: IndeksHari[] = [1, 2, 3, 4, 5, 6];

export interface RuangLabFisik {
  id: string;
  nama: string;
  alamat: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface KonfigurasiMatkul {
  id: string;
  nama: string;
  jumlahPertemuan: number;
  graceMenit: number;
  dendaNominal: number;
}

export interface KelasPraktikumItem {
  id: string;
  mataKuliah: string;
  kodeKelas: string;
  namaKelas: string;
  ruanganLabId: string;
  ruanganLabNama: string;
  alamat: string;
  lat: number;
  lng: number;
  radius: number;
  jumlahPertemuan: number;
  graceMenit: number;
  dendaNominal: number;
  hariRutin: IndeksHari;
  jamMulai: string;
  jamSelesai: string;
  tanggalMulai: string;
}

export interface SesiPertemuan extends Sesi {
  kelasId?: string;
  pertemuanKe?: number;
}

interface PersistedAslabState {
  ruangOverrides: Record<string, Partial<RuangLabFisik>>;
  mataKuliah: KonfigurasiMatkul[];
  kelasList: KelasPraktikumItem[];
  keanggotaan: Keanggotaan[];
  sesiOverride: SesiPertemuan[];
  deletedSesiIds: string[];
  deletedLabIds: string[];
  deletedMkKeys: string[];
}

const INITIAL_STATE: PersistedAslabState = {
  ruangOverrides: {},
  mataKuliah: [
    {
      id: 'mk-basis-data',
      nama: 'Basis Data',
      jumlahPertemuan: 8,
      graceMenit: DEFAULT_GRACE_MENIT,
      dendaNominal: DEFAULT_DENDA_NOMINAL,
    },
    {
      id: 'mk-sistem-operasi',
      nama: 'Sistem Operasi',
      jumlahPertemuan: 8,
      graceMenit: DEFAULT_GRACE_MENIT,
      dendaNominal: DEFAULT_DENDA_NOMINAL,
    },
  ],
  kelasList: [],
  keanggotaan: [],
  sesiOverride: [],
  deletedSesiIds: [],
  deletedLabIds: [],
  deletedMkKeys: [],
};

let memoryState: PersistedAslabState = INITIAL_STATE;
let hydrated = false;
let hydratingPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function hydrateOnce() {
  if (hydrated) return;
  if (hydratingPromise) return hydratingPromise;
  hydratingPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_ASLAB);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedAslabState>;
        memoryState = {
          ruangOverrides: parsed.ruangOverrides ?? {},
          mataKuliah: parsed.mataKuliah ?? INITIAL_STATE.mataKuliah,
          kelasList: parsed.kelasList ?? [],
          keanggotaan: parsed.keanggotaan ?? [],
          sesiOverride: parsed.sesiOverride ?? [],
          deletedSesiIds: parsed.deletedSesiIds ?? [],
          deletedLabIds: parsed.deletedLabIds ?? [],
          deletedMkKeys: parsed.deletedMkKeys ?? [],
        };
      }
    } catch {
      // Gunakan default jika pembacaan gagal
    } finally {
      hydrated = true;
      notifyListeners();
    }
  })();
  return hydratingPromise;
}

function updatePersisted(
  updater: (prev: PersistedAslabState) => PersistedAslabState,
) {
  memoryState = updater(memoryState);
  notifyListeners();
  void AsyncStorage.setItem(STORAGE_KEY_ASLAB, JSON.stringify(memoryState));
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Menghitung tanggal pertemuan ke-(indexMinggu + 1) yang jatuh tepat pada hariRutin
 * (misal setiap Jumat = 5) dimulai pada atau setelah tanggalAcuan.
 */
export function hitungTanggalPertemuanRutin(
  tanggalAcuanYmd: string,
  hariRutin: IndeksHari,
  indexMinggu: number,
): string {
  const base = parseYmd(tanggalAcuanYmd);
  const diff = (hariRutin - base.getDay() + 7) % 7;
  const target = new Date(base);
  target.setDate(base.getDate() + diff + indexMinggu * 7);
  return formatYmd(target);
}

export function hariIniYmd(): string {
  return formatYmd(new Date());
}

function bangunDaftarSesiRutin(
  kelas: KelasPraktikumItem,
  asistenId: string,
  existingSesi: SesiPertemuan[],
): SesiPertemuan[] {
  const hasil: SesiPertemuan[] = [];
  for (let i = 0; i < kelas.jumlahPertemuan; i += 1) {
    const ke = i + 1;
    const lama = existingSesi.find(
      (s) => s.kelasId === kelas.id && s.pertemuanKe === ke,
    );
    if (lama && lama.status !== 'TERJADWAL') {
      hasil.push(lama);
      continue;
    }
    const tanggal = hitungTanggalPertemuanRutin(
      kelas.tanggalMulai,
      kelas.hariRutin,
      i,
    );
    hasil.push({
      id: lama?.id ?? `sesi-${kelas.id}-p${ke}`,
      kelasId: kelas.id,
      pertemuanKe: ke,
      namaPraktikum: kelas.mataKuliah,
      topik: lama?.topik || `Pertemuan ${ke}`,
      kelas: kelas.kodeKelas,
      lab: kelas.ruanganLabNama,
      labId: kelas.ruanganLabId,
      tanggal,
      jamMulai: kelas.jamMulai,
      jamSelesai: kelas.jamSelesai,
      asistenId: lama?.asistenId || asistenId,
      status: 'TERJADWAL',
      deskripsi:
        lama?.deskripsi ||
        `${kelas.namaKelas} — Pertemuan ${ke} (${kelas.ruanganLabNama})`,
      kapasitas: 40,
    });
  }
  return hasil;
}

/**
 * Hook terpusat untuk 4 fitur Manajemen Lab Aslab + Kalender Jadwal:
 * 1. Kelola Lab (Ruangan & Radius)
 * 2. Kelola Mata Kuliah (Jumlah Pertemuan & Aturan Seragam)
 * 3. Kelola Kelas (Tambah/Hapus Kelas, Jadwal Rutin Mingguan, Anggota Manual & Bulk)
 * 4. Kelola Sesi & Kalender Jadwal (Auto-set tiap hari jadwal + ubah per pertemuan)
 */
export function useAslabStore() {
  const {
    currentUser,
    labs,
    sesi,
    users,
    keanggotaanLab,
    updateLab,
    createLab,
    addAnggotaBulk,
    pindahAnggota,
    createSession,
    updateSession,
    deleteSession,
  } = useSession();

  const [, forceRender] = useState(0);

  useEffect(() => {
    void hydrateOnce();
    const cb = () => forceRender((n) => n + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const snap = memoryState;

  // 1. Daftar Ruangan Lab Fisik (LABS_SEED + ruangan dari labs yang bukan kelas)
  const ruanganLabs = useMemo<RuangLabFisik[]>(() => {
    const peta = new Map<string, RuangLabFisik>();
    for (const seed of LABS_SEED) {
      const ov = snap.ruangOverrides[seed.id];
      peta.set(seed.id, {
        id: seed.id,
        nama: ov?.nama ?? seed.nama,
        alamat: ov?.alamat ?? seed.alamat,
        lat: ov?.lat ?? seed.lat,
        lng: ov?.lng ?? seed.lng,
        radius: ov?.radius ?? seed.radius,
      });
    }
    for (const l of labs) {
      // Hanya masukkan jika memang ruangan fisik murni (tanpa mataKuliah spesifik atau cocok id seed)
      if (peta.has(l.id)) {
        const ov = snap.ruangOverrides[l.id];
        peta.set(l.id, {
          id: l.id,
          nama: ov?.nama ?? l.nama,
          alamat: ov?.alamat ?? l.alamat,
          lat: ov?.lat ?? l.lat,
          lng: ov?.lng ?? l.lng,
          radius: ov?.radius ?? l.radius,
        });
      } else if (!l.mataKuliah) {
        const ov = snap.ruangOverrides[l.id];
        peta.set(l.id, {
          id: l.id,
          nama: ov?.nama ?? l.nama,
          alamat: ov?.alamat ?? l.alamat,
          lat: ov?.lat ?? l.lat,
          lng: ov?.lng ?? l.lng,
          radius: ov?.radius ?? l.radius,
        });
      }
    }
    return Array.from(peta.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );
  }, [labs, snap.ruangOverrides]);

  // 2. Daftar Kelas Praktikum (gabungan labs bermata-kuliah + kelasList lokal)
  const kelasList = useMemo<KelasPraktikumItem[]>(() => {
    const deletedSet = new Set(snap.deletedLabIds);
    const peta = new Map<string, KelasPraktikumItem>();

    // Dari Firestore/SessionContext labs yang memiliki mataKuliah
    for (const l of labs) {
      if (!l.mataKuliah?.trim() || deletedSet.has(l.id)) continue;
      const mk = l.mataKuliah.trim();
      const sisaKode = l.nama
        .replace(new RegExp(`^${mk}\\s*`, 'i'), '')
        .trim();
      const matchedRoom =
        ruanganLabs.find(
          (r) =>
            r.nama.toLowerCase() ===
            (l.ruanganLab ?? '').trim().toLowerCase(),
        ) ?? ruanganLabs[0];

      peta.set(l.id, {
        id: l.id,
        mataKuliah: mk,
        kodeKelas: sisaKode || l.nama,
        namaKelas: l.nama,
        ruanganLabId: matchedRoom?.id ?? l.id,
        ruanganLabNama: l.ruanganLab ?? matchedRoom?.nama ?? l.nama,
        alamat: l.alamat,
        lat: l.lat,
        lng: l.lng,
        radius: matchedRoom?.radius ?? l.radius ?? DEFAULT_RADIUS_LAB,
        jumlahPertemuan: l.jumlahPertemuan ?? DEFAULT_JUMLAH_PERTEMUAN,
        graceMenit: l.graceMenit ?? DEFAULT_GRACE_MENIT,
        dendaNominal: l.dendaNominal ?? DEFAULT_DENDA_NOMINAL,
        hariRutin: 5,
        jamMulai: '09:40',
        jamSelesai: '11:40',
        tanggalMulai: hariIniYmd(),
      });
    }

    // Override / tambahan dari kelasList lokal (memuat hariRutin, jamMulai, jamSelesai lengkap)
    for (const k of snap.kelasList) {
      if (deletedSet.has(k.id)) continue;
      const roomLive = ruanganLabs.find((r) => r.id === k.ruanganLabId);
      peta.set(k.id, {
        ...k,
        radius: roomLive?.radius ?? k.radius,
        alamat: roomLive?.alamat ?? k.alamat,
        lat: roomLive?.lat ?? k.lat,
        lng: roomLive?.lng ?? k.lng,
      });
    }

    return Array.from(peta.values()).sort((a, b) =>
      a.namaKelas.localeCompare(b.namaKelas),
    );
  }, [labs, ruanganLabs, snap.kelasList, snap.deletedLabIds]);

  // 3. Daftar Mata Kuliah Besar (gabungan konfigurasi matkul + yang muncul di kelas/sesi)
  const mataKuliahList = useMemo<KonfigurasiMatkul[]>(() => {
    const deletedMkSet = new Set(snap.deletedMkKeys);
    const peta = new Map<string, KonfigurasiMatkul>();
    for (const mk of snap.mataKuliah) {
      const k = mk.nama.trim().toLowerCase();
      if (!deletedMkSet.has(k)) peta.set(k, mk);
    }
    for (const kls of kelasList) {
      const key = kls.mataKuliah.trim().toLowerCase();
      if (!deletedMkSet.has(key) && !peta.has(key)) {
        peta.set(key, {
          id: `mk-${key.replace(/\s+/g, '-')}`,
          nama: kls.mataKuliah.trim(),
          jumlahPertemuan: kls.jumlahPertemuan,
          graceMenit: kls.graceMenit,
          dendaNominal: kls.dendaNominal,
        });
      }
    }
    for (const s of sesi) {
      const key = s.namaPraktikum.trim().toLowerCase();
      if (key && !deletedMkSet.has(key) && !peta.has(key)) {
        peta.set(key, {
          id: `mk-${key.replace(/\s+/g, '-')}`,
          nama: s.namaPraktikum.trim(),
          jumlahPertemuan: DEFAULT_JUMLAH_PERTEMUAN,
          graceMenit: DEFAULT_GRACE_MENIT,
          dendaNominal: DEFAULT_DENDA_NOMINAL,
        });
      }
    }
    return Array.from(peta.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );
  }, [snap.mataKuliah, snap.deletedMkKeys, kelasList, sesi]);

  // 4. Keanggotaan Gabungan (SessionContext + Lokal)
  const keanggotaanAll = useMemo<Keanggotaan[]>(() => {
    const deletedSet = new Set(snap.deletedLabIds);
    const peta = new Map<string, Keanggotaan>();
    for (const k of keanggotaanLab) {
      if (deletedSet.has(k.labId)) continue;
      peta.set(`${k.labId}_${k.uid}`, k);
    }
    for (const k of snap.keanggotaan) {
      if (deletedSet.has(k.labId)) continue;
      peta.set(`${k.labId}_${k.uid}`, k);
    }
    return Array.from(peta.values());
  }, [keanggotaanLab, snap.keanggotaan, snap.deletedLabIds]);

  // 5. Sesi Gabungan (SessionContext.sesi + Sesi Pertemuan Kelas)
  const sesiAll = useMemo<SesiPertemuan[]>(() => {
    const deletedSet = new Set(snap.deletedSesiIds);
    const deletedKelasSet = new Set(snap.deletedLabIds);
    const peta = new Map<string, SesiPertemuan>();

    for (const s of sesi) {
      if (deletedSet.has(s.id)) continue;
      peta.set(s.id, { ...s });
    }
    for (const s of snap.sesiOverride) {
      if (deletedSet.has(s.id)) continue;
      if (s.kelasId && deletedKelasSet.has(s.kelasId)) continue;
      peta.set(s.id, s);
    }

    return Array.from(peta.values()).sort((a, b) => {
      const cmpTgl = a.tanggal.localeCompare(b.tanggal);
      if (cmpTgl !== 0) return cmpTgl;
      return a.jamMulai.localeCompare(b.jamMulai);
    });
  }, [sesi, snap.sesiOverride, snap.deletedSesiIds, snap.deletedLabIds]);

  // =========================================================================
  // ACTIONS
  // =========================================================================

  const simpanRadiusRuang = useCallback(
    async (
      ruangId: string,
      patch: { radius: number; lat?: number; lng?: number; alamat?: string },
    ) => {
      const target = ruanganLabs.find((r) => r.id === ruangId);
      if (!target) return false;
      const lat = patch.lat ?? target.lat;
      const lng = patch.lng ?? target.lng;
      const alamat = patch.alamat ?? target.alamat;

      updatePersisted((prev) => ({
        ...prev,
        ruangOverrides: {
          ...prev.ruangOverrides,
          [ruangId]: {
            ...prev.ruangOverrides[ruangId],
            radius: patch.radius,
            lat,
            lng,
            alamat,
          },
        },
        kelasList: prev.kelasList.map((k) =>
          k.ruanganLabId === ruangId
            ? { ...k, radius: patch.radius, lat, lng, alamat }
            : k,
        ),
      }));

      try {
        await updateLab(ruangId, { lat, lng, radius: patch.radius });
      } catch {
        // Tetap tersimpan pada store lokal bila role dibatasi rules lama
      }
      return true;
    },
    [ruanganLabs, updateLab],
  );

  const simpanMataKuliah = useCallback(
    (input: {
      nama: string;
      jumlahPertemuan: number;
      graceMenit: number;
      dendaNominal: number;
    }) => {
      const namaBersih = input.nama.trim();
      if (!namaBersih) return false;
      const key = namaBersih.toLowerCase();
      const id = `mk-${key.replace(/\s+/g, '-')}`;

      updatePersisted((prev) => {
        const idx = prev.mataKuliah.findIndex(
          (m) => m.nama.trim().toLowerCase() === key,
        );
        const itemBaru: KonfigurasiMatkul = {
          id,
          nama: namaBersih,
          jumlahPertemuan: input.jumlahPertemuan,
          graceMenit: input.graceMenit,
          dendaNominal: input.dendaNominal,
        };
        const nextMk =
          idx >= 0
            ? prev.mataKuliah.map((m, i) => (i === idx ? itemBaru : m))
            : [...prev.mataKuliah, itemBaru];

        // Sinkronkan seluruh kelas pada mata kuliah ini + sesuaikan jumlah sesi rutinnya
        const nextKelas = prev.kelasList.map((k) =>
          k.mataKuliah.trim().toLowerCase() === key
            ? {
                ...k,
                jumlahPertemuan: input.jumlahPertemuan,
                graceMenit: input.graceMenit,
                dendaNominal: input.dendaNominal,
              }
            : k,
        );

        let nextSesi = [...prev.sesiOverride];
        for (const k of nextKelas) {
          if (k.mataKuliah.trim().toLowerCase() !== key) continue;
          const generated = bangunDaftarSesiRutin(
            k,
            currentUser?.id ?? 'aslab',
            nextSesi,
          );
          nextSesi = nextSesi.filter(
            (s) =>
              s.kelasId !== k.id ||
              (s.pertemuanKe !== undefined &&
                s.pertemuanKe <= k.jumlahPertemuan &&
                s.status !== 'TERJADWAL'),
          );
          for (const g of generated) {
            const adaIdx = nextSesi.findIndex((s) => s.id === g.id);
            if (adaIdx >= 0) nextSesi[adaIdx] = g;
            else nextSesi.push(g);
          }
        }

        return {
          ...prev,
          mataKuliah: nextMk,
          kelasList: nextKelas,
          sesiOverride: nextSesi,
          deletedMkKeys: prev.deletedMkKeys.filter((x) => x !== key),
        };
      });
      return true;
    },
    [currentUser?.id],
  );

  const hapusMataKuliah = useCallback((namaMk: string) => {
    const key = namaMk.trim().toLowerCase();
    updatePersisted((prev) => {
      const kelasDihapusIds = new Set(
        prev.kelasList
          .filter((k) => k.mataKuliah.trim().toLowerCase() === key)
          .map((k) => k.id),
      );
      return {
        ...prev,
        mataKuliah: prev.mataKuliah.filter(
          (m) => m.nama.trim().toLowerCase() !== key,
        ),
        kelasList: prev.kelasList.filter(
          (k) => k.mataKuliah.trim().toLowerCase() !== key,
        ),
        keanggotaan: prev.keanggotaan.filter(
          (a) =>
            !kelasDihapusIds.has(a.labId) &&
            a.mataKuliah.trim().toLowerCase() !== key,
        ),
        sesiOverride: prev.sesiOverride.filter(
          (s) =>
            !(s.kelasId && kelasDihapusIds.has(s.kelasId)) &&
            s.namaPraktikum.trim().toLowerCase() !== key,
        ),
        deletedLabIds: Array.from(
          new Set([...prev.deletedLabIds, ...Array.from(kelasDihapusIds)]),
        ),
        deletedMkKeys: Array.from(new Set([...prev.deletedMkKeys, key])),
      };
    });
  }, []);

  const buatKelasBaru = useCallback(
    async (
      input: {
        mataKuliah: string;
        kodeKelas: string;
        ruanganLabId: string;
        hariRutin: IndeksHari;
        jamMulai: string;
        jamSelesai: string;
        tanggalMulai: string;
        jumlahPertemuan?: number;
        graceMenit?: number;
        dendaNominal?: number;
      },
      asprakIds: string[],
      praktikanIds: string[],
    ): Promise<{ ok: true; kelasId: string } | { ok: false; alasan: string }> => {
      const mkBersih = input.mataKuliah.trim();
      const kodeBersih = input.kodeKelas.trim();
      if (!mkBersih || !kodeBersih) {
        return { ok: false, alasan: 'Mata kuliah dan nama/kode kelas wajib diisi.' };
      }

      const ruang =
        ruanganLabs.find((r) => r.id === input.ruanganLabId) ?? ruanganLabs[0];
      if (!ruang) {
        return { ok: false, alasan: 'Pilih ruangan laboratorium terlebih dahulu.' };
      }

      const mkRule = mataKuliahList.find(
        (m) => m.nama.trim().toLowerCase() === mkBersih.toLowerCase(),
      );
      const jumlahPertemuan =
        input.jumlahPertemuan ?? mkRule?.jumlahPertemuan ?? DEFAULT_JUMLAH_PERTEMUAN;
      const graceMenit =
        input.graceMenit ?? mkRule?.graceMenit ?? DEFAULT_GRACE_MENIT;
      const dendaNominal =
        input.dendaNominal ?? mkRule?.dendaNominal ?? DEFAULT_DENDA_NOMINAL;

      const namaKelas = kodeBersih.toLowerCase().startsWith(mkBersih.toLowerCase())
        ? kodeBersih
        : `${mkBersih} ${kodeBersih}`;

      let kelasId = `kelas-${Date.now()}`;
      try {
        const resCtx = await createLab({
          nama: namaKelas,
          mataKuliah: mkBersih,
          ruanganLab: ruang.nama,
          jumlahPertemuan,
          alamat: ruang.alamat,
          lat: ruang.lat,
          lng: ruang.lng,
          radius: ruang.radius,
          graceMenit,
          dendaNominal,
          aslabId: currentUser?.id,
        });
        if (resCtx.ok) {
          kelasId = resCtx.labId;
        }
      } catch {
        // Fallback ke store lokal jika stub
      }

      const kelasBaru: KelasPraktikumItem = {
        id: kelasId,
        mataKuliah: mkBersih,
        kodeKelas: kodeBersih,
        namaKelas,
        ruanganLabId: ruang.id,
        ruanganLabNama: ruang.nama,
        alamat: ruang.alamat,
        lat: ruang.lat,
        lng: ruang.lng,
        radius: ruang.radius,
        jumlahPertemuan,
        graceMenit,
        dendaNominal,
        hariRutin: input.hariRutin,
        jamMulai: input.jamMulai,
        jamSelesai: input.jamSelesai,
        tanggalMulai: input.tanggalMulai || hariIniYmd(),
      };

      const asistenPengampuId = asprakIds[0] || currentUser?.id || 'a1';
      const sesiRutin = bangunDaftarSesiRutin(kelasBaru, asistenPengampuId, []);

      const anggotaBaru: Keanggotaan[] = [
        ...asprakIds.map((uid) => ({
          id: `${kelasId}_${uid}`,
          labId: kelasId,
          uid,
          peran: 'asprak' as const,
          mataKuliah: mkBersih,
        })),
        ...praktikanIds.map((uid) => ({
          id: `${kelasId}_${uid}`,
          labId: kelasId,
          uid,
          peran: 'praktikan' as const,
          mataKuliah: mkBersih,
        })),
      ];

      updatePersisted((prev) => {
        const keyMk = mkBersih.toLowerCase();
        const adaMk = prev.mataKuliah.some(
          (m) => m.nama.trim().toLowerCase() === keyMk,
        );
        return {
          ...prev,
          mataKuliah: adaMk
            ? prev.mataKuliah
            : [
                ...prev.mataKuliah,
                {
                  id: `mk-${keyMk.replace(/\s+/g, '-')}`,
                  nama: mkBersih,
                  jumlahPertemuan,
                  graceMenit,
                  dendaNominal,
                },
              ],
          kelasList: [...prev.kelasList, kelasBaru],
          keanggotaan: [...prev.keanggotaan, ...anggotaBaru],
          sesiOverride: [...prev.sesiOverride, ...sesiRutin],
          deletedMkKeys: prev.deletedMkKeys.filter((x) => x !== keyMk),
        };
      });

      if (asprakIds.length > 0) {
        const asprakPayload = asprakIds
          .map((id) => users.find((u) => u.id === id))
          .filter(Boolean)
          .map((u) => ({ nim: u!.nim, email: u!.email }));
        void addAnggotaBulk(kelasId, 'asprak', asprakPayload).catch(() => {});
      }
      if (praktikanIds.length > 0) {
        const praktikanPayload = praktikanIds
          .map((id) => users.find((u) => u.id === id))
          .filter(Boolean)
          .map((u) => ({ nim: u!.nim, email: u!.email }));
        void addAnggotaBulk(kelasId, 'praktikan', praktikanPayload).catch(
          () => {},
        );
      }

      return { ok: true, kelasId };
    },
    [
      ruanganLabs,
      mataKuliahList,
      createLab,
      currentUser?.id,
      users,
      addAnggotaBulk,
    ],
  );

  const ubahJadwalDanInfoKelas = useCallback(
    (
      kelasId: string,
      patch: Partial<
        Pick<
          KelasPraktikumItem,
          | 'kodeKelas'
          | 'ruanganLabId'
          | 'hariRutin'
          | 'jamMulai'
          | 'jamSelesai'
          | 'tanggalMulai'
        >
      >,
      sinkronSesiRutin = true,
    ) => {
      const target = kelasList.find((k) => k.id === kelasId);
      if (!target) return false;
      const ruangBaru = patch.ruanganLabId
        ? ruanganLabs.find((r) => r.id === patch.ruanganLabId)
        : ruanganLabs.find((r) => r.id === target.ruanganLabId);

      const kodeBaru = (patch.kodeKelas ?? target.kodeKelas).trim();
      const namaKelasBaru = kodeBaru
        .toLowerCase()
        .startsWith(target.mataKuliah.toLowerCase())
        ? kodeBaru
        : `${target.mataKuliah} ${kodeBaru}`;

      const updated: KelasPraktikumItem = {
        ...target,
        ...patch,
        kodeKelas: kodeBaru,
        namaKelas: namaKelasBaru,
        ruanganLabId: ruangBaru?.id ?? target.ruanganLabId,
        ruanganLabNama: ruangBaru?.nama ?? target.ruanganLabNama,
        alamat: ruangBaru?.alamat ?? target.alamat,
        lat: ruangBaru?.lat ?? target.lat,
        lng: ruangBaru?.lng ?? target.lng,
        radius: ruangBaru?.radius ?? target.radius,
      };

      updatePersisted((prev) => {
        const adaLokal = prev.kelasList.some((k) => k.id === kelasId);
        const nextKelas = adaLokal
          ? prev.kelasList.map((k) => (k.id === kelasId ? updated : k))
          : [...prev.kelasList, updated];

        let nextSesi = [...prev.sesiOverride];
        if (sinkronSesiRutin) {
          const regenerated = bangunDaftarSesiRutin(
            updated,
            currentUser?.id ?? 'aslab',
            nextSesi,
          );
          nextSesi = nextSesi.filter((s) => s.kelasId !== kelasId);
          nextSesi.push(...regenerated);
        }

        return {
          ...prev,
          kelasList: nextKelas,
          sesiOverride: nextSesi,
        };
      });
      return true;
    },
    [kelasList, ruanganLabs, currentUser?.id],
  );

  const hapusKelas = useCallback((kelasId: string) => {
    updatePersisted((prev) => ({
      ...prev,
      kelasList: prev.kelasList.filter((k) => k.id !== kelasId),
      keanggotaan: prev.keanggotaan.filter((a) => a.labId !== kelasId),
      sesiOverride: prev.sesiOverride.filter((s) => s.kelasId !== kelasId),
      deletedLabIds: Array.from(new Set([...prev.deletedLabIds, kelasId])),
    }));
  }, []);

  const tambahAnggotaKelas = useCallback(
    async (
      kelasId: string,
      peran: 'praktikan' | 'asprak',
      uids: string[],
    ) => {
      const kls = kelasList.find((k) => k.id === kelasId);
      if (!kls || uids.length === 0) return 0;

      updatePersisted((prev) => {
        const existingKeys = new Set(
          prev.keanggotaan.map((x) => `${x.labId}_${x.uid}`),
        );
        const tambahan: Keanggotaan[] = [];
        for (const uid of uids) {
          const key = `${kelasId}_${uid}`;
          if (!existingKeys.has(key)) {
            tambahan.push({
              id: key,
              labId: kelasId,
              uid,
              peran,
              mataKuliah: kls.mataKuliah,
            });
          }
        }
        return {
          ...prev,
          keanggotaan: [...prev.keanggotaan, ...tambahan],
        };
      });

      const payload = uids
        .map((id) => users.find((u) => u.id === id))
        .filter(Boolean)
        .map((u) => ({ nim: u!.nim, email: u!.email }));
      void addAnggotaBulk(kelasId, peran, payload).catch(() => {});

      return uids.length;
    },
    [kelasList, users, addAnggotaBulk],
  );

  const hapusAnggotaKelas = useCallback((kelasId: string, uid: string) => {
    updatePersisted((prev) => ({
      ...prev,
      keanggotaan: prev.keanggotaan.filter(
        (k) => !(k.labId === kelasId && k.uid === uid),
      ),
    }));
  }, []);

  const pindahKelasAnggota = useCallback(
    async (uid: string, dariKelasId: string, keKelasId: string) => {
      if (dariKelasId === keKelasId) {
        return { ok: false as const, alasan: 'Kelas tujuan sama dengan kelas asal.' };
      }
      const klsTujuan = kelasList.find((k) => k.id === keKelasId);
      if (!klsTujuan) {
        return { ok: false as const, alasan: 'Kelas tujuan tidak ditemukan.' };
      }
      const asal = keanggotaanAll.find(
        (k) => k.labId === dariKelasId && k.uid === uid,
      );
      const peran = asal?.peran ?? 'praktikan';

      updatePersisted((prev) => {
        const tanpaAsal = prev.keanggotaan.filter(
          (k) => !(k.labId === dariKelasId && k.uid === uid),
        );
        const baru: Keanggotaan = {
          id: `${keKelasId}_${uid}`,
          labId: keKelasId,
          uid,
          peran,
          mataKuliah: klsTujuan.mataKuliah,
        };
        return {
          ...prev,
          keanggotaan: [
            ...tanpaAsal.filter(
              (k) => !(k.labId === keKelasId && k.uid === uid),
            ),
            baru,
          ],
        };
      });

      void pindahAnggota(uid, dariKelasId, keKelasId).catch(() => {});
      return { ok: true as const };
    },
    [kelasList, keanggotaanAll, pindahAnggota],
  );

  // Auto-generate / reset seluruh pertemuan 1..N sesuai hari rutin kelas (misal setiap Jumat)
  const generateSesiOtomatisKelas = useCallback(
    (kelasId: string, tanggalAcuan?: string) => {
      const kls = kelasList.find((k) => k.id === kelasId);
      if (!kls) return false;
      const klsPakai: KelasPraktikumItem = tanggalAcuan
        ? { ...kls, tanggalMulai: tanggalAcuan }
        : kls;

      updatePersisted((prev) => {
        const nextKelas = tanggalAcuan
          ? prev.kelasList.map((x) =>
              x.id === kelasId ? { ...x, tanggalMulai: tanggalAcuan } : x,
            )
          : prev.kelasList;
        const generated = bangunDaftarSesiRutin(
          klsPakai,
          currentUser?.id ?? 'aslab',
          prev.sesiOverride.filter((s) => s.status !== 'TERJADWAL'),
        );
        const sisaLain = prev.sesiOverride.filter((s) => s.kelasId !== kelasId);
        return {
          ...prev,
          kelasList: nextKelas,
          sesiOverride: [...sisaLain, ...generated],
        };
      });
      return true;
    },
    [kelasList, currentUser?.id],
  );

  // Simpan / reschedule satu sesi pertemuan (dari Kelola Sesi maupun Kalender Jadwal)
  const simpanSesiPertemuan = useCallback(
    async (input: {
      id?: string;
      kelasId?: string;
      pertemuanKe?: number;
      namaPraktikum: string;
      kelas: string;
      ruanganLabId: string;
      topik?: string;
      tanggal: string;
      jamMulai: string;
      jamSelesai: string;
      deskripsi?: string;
    }) => {
      const ruang =
        ruanganLabs.find((r) => r.id === input.ruanganLabId) ?? ruanganLabs[0];
      const labNama = ruang?.nama ?? 'Lab B';
      const labId = ruang?.id ?? 'lab-b';

      const idPakai = input.id ?? `sesi-custom-${Date.now()}`;
      const existing = sesiAll.find((s) => s.id === idPakai);

      const itemSesi: SesiPertemuan = {
        id: idPakai,
        kelasId: input.kelasId ?? existing?.kelasId,
        pertemuanKe: input.pertemuanKe ?? existing?.pertemuanKe,
        namaPraktikum: input.namaPraktikum.trim(),
        topik:
          input.topik?.trim() ||
          existing?.topik ||
          (input.pertemuanKe ? `Pertemuan ${input.pertemuanKe}` : 'Sesi Praktikum'),
        kelas: input.kelas.trim(),
        lab: labNama,
        labId,
        tanggal: input.tanggal.trim(),
        jamMulai: input.jamMulai.trim(),
        jamSelesai: input.jamSelesai.trim(),
        asistenId: existing?.asistenId ?? currentUser?.id ?? 'a1',
        status: existing?.status ?? 'TERJADWAL',
        deskripsi:
          input.deskripsi?.trim() ||
          existing?.deskripsi ||
          `${input.namaPraktikum.trim()} ${input.kelas.trim()} (${labNama})`,
        kapasitas: existing?.kapasitas ?? 40,
      };

      updatePersisted((prev) => {
        const tanpa = prev.sesiOverride.filter((s) => s.id !== idPakai);
        return {
          ...prev,
          sesiOverride: [...tanpa, itemSesi],
        };
      });

      // Sinkron ke SessionContext bila sesi berasal dari koleksi utama
      if (sesi.some((s) => s.id === idPakai)) {
        void updateSession(idPakai, {
          namaPraktikum: itemSesi.namaPraktikum,
          topik: itemSesi.topik,
          kelas: itemSesi.kelas,
          lab: itemSesi.lab,
          labId: itemSesi.labId,
          tanggal: itemSesi.tanggal,
          jamMulai: itemSesi.jamMulai,
          jamSelesai: itemSesi.jamSelesai,
          deskripsi: itemSesi.deskripsi,
        }).catch(() => {});
      } else if (!input.id) {
        void createSession({
          namaPraktikum: itemSesi.namaPraktikum,
          topik: itemSesi.topik,
          kelas: itemSesi.kelas,
          lab: itemSesi.lab,
          labId: itemSesi.labId,
          tanggal: itemSesi.tanggal,
          jamMulai: itemSesi.jamMulai,
          jamSelesai: itemSesi.jamSelesai,
          deskripsi: itemSesi.deskripsi,
          kapasitas: 40,
        }).catch(() => {});
      }

      return itemSesi;
    },
    [ruanganLabs, sesiAll, currentUser?.id, sesi, updateSession, createSession],
  );

  const hapusSesiPertemuan = useCallback(
    async (sesiId: string) => {
      updatePersisted((prev) => ({
        ...prev,
        sesiOverride: prev.sesiOverride.filter((s) => s.id !== sesiId),
        deletedSesiIds: Array.from(new Set([...prev.deletedSesiIds, sesiId])),
      }));
      if (sesi.some((s) => s.id === sesiId)) {
        void deleteSession(sesiId).catch(() => {});
      }
    },
    [sesi, deleteSession],
  );

  return {
    ruanganLabs,
    mataKuliahList,
    kelasList,
    keanggotaanAll,
    sesiAll,
    simpanRadiusRuang,
    simpanMataKuliah,
    hapusMataKuliah,
    buatKelasBaru,
    ubahJadwalDanInfoKelas,
    hapusKelas,
    tambahAnggotaKelas,
    hapusAnggotaKelas,
    pindahKelasAnggota,
    generateSesiOtomatisKelas,
    simpanSesiPertemuan,
    hapusSesiPertemuan,
  };
}
