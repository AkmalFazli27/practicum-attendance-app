import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/context/SessionContext';
import { type StatusSesi } from '@/data/dummy';
import { formatTanggal } from '@/utils/format';

const WARNA_STATUS: Record<StatusSesi, { latar: string; teks: string }> = {
  TERJADWAL: { latar: '#E5E7EB', teks: '#374151' },
  DIBUKA: { latar: '#DCFCE7', teks: '#166534' },
  SELESAI: { latar: '#FEE2E2', teks: '#991B1B' },
};

export default function LandingSkeleton() {
  const { sesi } = useSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={sesi}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.judul}>Sistem Informasi Praktikum</Text>
            <Text style={styles.subjudul}>
              Skeleton Sprint 1 - data dummy sudah tersambung ke SessionContext.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const warna = WARNA_STATUS[item.status];
          return (
            <View style={styles.kartu}>
              <View style={styles.barisAtas}>
                <Text style={styles.namaPraktikum}>{item.namaPraktikum}</Text>
                <View style={[styles.badge, { backgroundColor: warna.latar }]}>
                  <Text style={[styles.badgeTeks, { color: warna.teks }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.detail}>
                {item.kelas} - {item.lab}
              </Text>
              <Text style={styles.detail}>
                {formatTanggal(item.tanggal)} - {item.jamMulai}-{item.jamSelesai}
              </Text>
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={styles.catatan}>
            Layar ini masih skeleton. Landing final, login, dan halaman per peran dikerjakan
            sesuai pembagian tugas di docs/sprints/sprint-1.md.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  header: {
    marginBottom: 8,
  },
  judul: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subjudul: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  kartu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  barisAtas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  namaPraktikum: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeTeks: {
    fontSize: 11,
    fontWeight: '700',
  },
  detail: {
    fontSize: 13,
    color: '#64748B',
  },
  catatan: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
  },
});
