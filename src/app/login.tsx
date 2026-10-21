import { StyleSheet, Text, View } from 'react-native';

export default function LoginSkeleton() {
  return (
    <View style={styles.container}>
      <Text style={styles.judul}>Login</Text>
      <Text style={styles.keterangan}>
        Layar ini masih placeholder. Form pemilihan peran dan user dikerjakan pada tiket P1-02.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  judul: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  keterangan: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#64748B',
  },
});
