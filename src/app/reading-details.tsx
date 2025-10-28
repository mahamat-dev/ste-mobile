import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { meterApi } from '../services/api';

export default function ReadingDetailsPage() {
  const router = useRouter();
  const { meterId: meterIdParam, readingId: readingIdParam } = useLocalSearchParams<{ meterId?: string; readingId?: string }>();
  const meterId = useMemo(() => (meterIdParam ? Number(meterIdParam) : NaN), [meterIdParam]);
  const readingId = useMemo(() => (readingIdParam ? Number(readingIdParam) : NaN), [readingIdParam]);

  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<any | null>(null);
  const [meter, setMeter] = useState<any | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      if (!meterId || Number.isNaN(meterId) || !readingId || Number.isNaN(readingId)) {
        Alert.alert('Erreur', 'Paramètres de relevé invalides.');
        setLoading(false);
        return;
      }
      try {
        const [meterRes, readingsRes] = await Promise.all([
          meterApi.getMeterById(meterId),
          meterApi.getReadings(meterId),
        ]);
        setMeter(meterRes.data);
        const found = (readingsRes.data || []).find((r: any) => Number(r.readingId) === Number(readingId));
        setReading(found || null);
      } catch (e: any) {
        Alert.alert('Erreur', e?.message || 'Impossible de charger les détails du relevé.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [meterId, readingId]);

  let photos: string[] = [];
  try {
    photos = reading?.photoUrls ? JSON.parse(reading.photoUrls) || [] : [];
  } catch {
    photos = [];
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Retour'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails Relevé</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : !reading ? (
        <View style={styles.loaderBox}>
          <Text style={styles.errorText}>Relevé introuvable.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Client Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Client</Text>
            <Text style={styles.cardItem}>Nom: {meter?.customer?.fullName || '—'}</Text>
            <Text style={styles.cardItem}>Téléphone: {meter?.customer?.phone || '—'}</Text>
            <Text style={styles.cardItem}>Compteur: {meter?.meterNumber || meter?.meterId || '—'}</Text>
            <Text style={styles.cardItem}>Adresse: {meter?.customer?.Address ? `${meter.customer.Address.street || ''} ${meter.customer.Address.city || ''}` : '—'}</Text>
          </View>

          {/* Reading Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Relevé</Text>
            <Text style={styles.cardItem}>Date: {reading.readingDate ? new Date(reading.readingDate).toLocaleString() : '—'}</Text>
            <Text style={styles.cardItem}>Index: {typeof reading.readingValue === 'number' ? reading.readingValue : Number(reading.readingValue) || '—'}</Text>
            <Text style={styles.cardItem}>Statut: {reading.status || '—'}</Text>
            {reading.notes ? <Text style={styles.cardItem}>Notes: {reading.notes}</Text> : null}
          </View>

          {/* Photos */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Photos</Text>
            {photos.length === 0 ? (
              <Text style={styles.cardItem}>Aucune photo associée.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {photos.map((uri, i) => (
                  <TouchableOpacity key={`${uri}-${i}`} onPress={() => { setViewerIndex(i); setViewerVisible(true); }}>
                    <Image source={{ uri }} style={styles.photo} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
          {/* Fullscreen Image Viewer */}
          {viewerVisible && (
            <View style={styles.viewerOverlay}>
              <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
                <Text style={styles.viewerCloseText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.viewerContent}>
                {photos[viewerIndex] ? (
                  <Image source={{ uri: photos[viewerIndex] }} style={styles.viewerImage} />
                ) : (
                  <Text style={styles.errorText}>Image introuvable</Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f9fc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  backText: { color: '#0066cc', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#b91c1c' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  cardItem: { fontSize: 14, color: '#374151', marginTop: 2 },
  photo: { width: 160, height: 160, borderRadius: 8, marginRight: 10, backgroundColor: '#f3f4f6' },
  viewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerContent: { width: '92%', height: '80%', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 8 },
  viewerClose: { position: 'absolute', top: 24, right: 24, padding: 8 },
  viewerCloseText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
});