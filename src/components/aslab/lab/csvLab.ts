import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';

export type JenisTemplateCsv = 'lab' | 'praktikan' | 'asprak';

export const HEADER_CSV: Record<JenisTemplateCsv, string[]> = {
  lab: [
    'nama',
    'alamat',
    'lat',
    'lng',
    'radius',
    'graceMenit',
    'dendaNominal',
  ],
  praktikan: ['nim', 'email', 'nama'],
  asprak: ['nim', 'email', 'nama'],
};

const KONTEN_TEMPLATE: Record<JenisTemplateCsv, string> = {
  lab: [
    'nama,alamat,lat,lng,radius,graceMenit,dendaNominal',
    '"Lab Basis Data A","Gedung E FSM UNDIP Lantai 2",-7.0490375,110.441484,100,15,5000',
    '"Lab Basis Data B","Gedung E FSM UNDIP Lantai 3",-7.04912,110.44162,120,10,5000',
  ].join('\n'),
  praktikan: [
    'nim,email,nama',
    '2310512001,andi.pratama@tapin.ac.id,Andi Pratama',
    '2310512002,bella.putri@tapin.ac.id,Bella Putri',
  ].join('\n'),
  asprak: [
    'nim,email,nama',
    '2210512001,budi.santoso@tapin.ac.id,Budi Santoso',
    '2210512002,siti.rahma@tapin.ac.id,Siti Rahma',
  ].join('\n'),
};

const NAMA_FILE_TEMPLATE: Record<JenisTemplateCsv, string> = {
  lab: 'template-bulk-lab-tapin.csv',
  praktikan: 'template-bulk-praktikan-tapin.csv',
  asprak: 'template-bulk-asprak-tapin.csv',
};

/**
 * Menghasilkan dan membagikan/mengunduh file template CSV terpisah untuk
 * Bulk Lab, Bulk Praktikan, atau Bulk Asprak.
 */
export async function unduhTemplateCsv(jenis: JenisTemplateCsv): Promise<{
  ok: boolean;
  fileName: string;
}> {
  const fileName = NAMA_FILE_TEMPLATE[jenis];
  const isi = KONTEN_TEMPLATE[jenis];

  try {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
        const blob = new Blob([isi], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { ok: true, fileName };
      }
      return { ok: false, fileName };
    }

    const file = new File(Paths.cache, fileName);
    try {
      if (!file.exists) {
        file.create({ overwrite: true });
      }
    } catch {
      // Abaikan bila write langsung menimpa
    }
    await file.write(isi);

    const bisaShare = await Sharing.isAvailableAsync();
    if (!bisaShare) {
      return { ok: false, fileName };
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: fileName,
      UTI: 'public.comma-separated-values-text',
    });
    return { ok: true, fileName };
  } catch {
    return { ok: false, fileName };
  }
}

export type HasilBacaCsv =
  | {
      ok: true;
      fileName: string;
      rows: Record<string, string>[];
    }
  | {
      ok: false;
      canceled?: boolean;
      errorKind: 'empty' | 'header' | 'corrupt';
      expectedHeaders?: string[];
    };

function normalisasiHeader(h: string): string {
  return (h || '').replace(/^\uFEFF/, '').trim().toLowerCase();
}

const ALIAS_HEADER: Record<string, string> = {
  nama: 'nama',
  name: 'nama',
  nama_lab: 'nama',
  namalab: 'nama',
  alamat: 'alamat',
  address: 'alamat',
  lokasi: 'alamat',
  lat: 'lat',
  latitude: 'lat',
  lng: 'lng',
  lon: 'lng',
  longitude: 'lng',
  radius: 'radius',
  grace: 'graceMenit',
  gracemenit: 'graceMenit',
  grace_menit: 'graceMenit',
  graceperiod: 'graceMenit',
  denda: 'dendaNominal',
  dendanominal: 'dendaNominal',
  denda_nominal: 'dendaNominal',
  nominaldenda: 'dendaNominal',
  nim: 'nim',
  student_id: 'nim',
  email: 'email',
};

/**
 * Memilih file CSV memakai `expo-document-picker`, membaca isinya lewat
 * `expo-file-system` (SDK 58 File API) atau Web File API, lalu mem-parse
 * memakai `papaparse` beserta validasi kolom wajib.
 */
export async function pilihDanBacaCsv(
  jenis: JenisTemplateCsv,
): Promise<HasilBacaCsv> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (picked.canceled || !picked.assets || picked.assets.length === 0) {
      return { ok: false, canceled: true, errorKind: 'empty' };
    }

    const asset = picked.assets[0];
    let rawText = '';

    if (Platform.OS === 'web' && asset.file) {
      rawText = await asset.file.text();
    } else {
      try {
        const fsFile = new File(asset.uri);
        rawText = await fsFile.text();
      } catch {
        const res = await fetch(asset.uri);
        rawText = await res.text();
      }
    }

    const trimmed = rawText.replace(/^\uFEFF/, '').trim();
    if (!trimmed) {
      return { ok: false, errorKind: 'empty' };
    }

    const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => {
        const key = normalisasiHeader(header);
        return ALIAS_HEADER[key] ?? key;
      },
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return { ok: false, errorKind: 'corrupt' };
    }

    const fields = (parsed.meta.fields ?? []).map((f) => f.trim());
    const requiredCols =
      jenis === 'lab'
        ? ['nama', 'alamat', 'lat', 'lng', 'radius']
        : [];

    if (jenis === 'lab') {
      const missing = requiredCols.some((c) => !fields.includes(c));
      if (missing) {
        return {
          ok: false,
          errorKind: 'header',
          expectedHeaders: HEADER_CSV.lab,
        };
      }
    } else {
      const hasNimOrEmail = fields.includes('nim') || fields.includes('email');
      if (!hasNimOrEmail) {
        return {
          ok: false,
          errorKind: 'header',
          expectedHeaders: HEADER_CSV[jenis],
        };
      }
    }

    const normalizedRows = parsed.data
      .map((row) => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          if (k === '__parsed_extra') continue;
          out[k] = v === null || v === undefined ? '' : String(v).trim();
        }
        return out;
      })
      .filter((row) => Object.values(row).some((val) => val.length > 0));

    if (normalizedRows.length === 0) {
      return { ok: false, errorKind: 'empty' };
    }

    return {
      ok: true,
      fileName: asset.name || NAMA_FILE_TEMPLATE[jenis],
      rows: normalizedRows,
    };
  } catch {
    return { ok: false, errorKind: 'corrupt' };
  }
}
