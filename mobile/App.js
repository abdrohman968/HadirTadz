import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';

// Host LAN PC diambil dari alamat Metro (hostUri) yang dihubungi Expo Go,
// mis. "192.168.1.10:8081" -> "192.168.1.10". Dengan ini IP lokal tidak perlu
// diedit manual; otomatis mengikuti IP PC di WiFi yang sama.
const getLanHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  return hostUri.split(':')[0] || '10.0.2.2';
};

const LAN_HOST = getLanHost();

const TARGETS = [
  {
    key: 'local',
    label: 'Lokal',
    uri: `http://${LAN_HOST}/absensi_digital/auth/login.php`,
  },
  {
    key: 'online',
    label: 'Online',
    uri: 'https://hadirtadz.vercel.app/login',
  },
];

export default function App() {
  const webRef = useRef(null);
  const [target, setTarget] = useState(TARGETS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const switchTarget = (t) => {
    setError(null);
    setLoading(true);
    setTarget(t);
    webRef.current?.reload();
  };

  const onNavigationStateChange = (nav) => {
    if (error) {
      setLoading(true);
      setError(null);
    }
    const internalHost =
      nav.url.startsWith(`http://${LAN_HOST}`) ||
      nav.url.startsWith('http://10.0.2.2') ||
      nav.url.startsWith('http://localhost') ||
      nav.url.startsWith('https://hadirtadz.vercel.app');
    if (!internalHost && (nav.url.startsWith('http') || nav.url.startsWith('wa.me') || nav.url.startsWith('https://wa.me'))) {
      Linking.openURL(nav.url).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.topbar}>
        <Text style={styles.title}>HadirTadz</Text>
        <View style={styles.seg}>
          {TARGETS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => switchTarget(t)}
              style={[styles.segBtn, target.key === t.key && styles.segBtnActive]}
            >
              <Text style={[styles.segText, target.key === t.key && styles.segTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => webRef.current?.reload()} style={styles.reload}>
          <Text style={styles.reloadText}>Muat Ulang</Text>
        </Pressable>
      </View>

      <View style={styles.webwrap}>
        {loading && (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        )}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Gagal Terhubung</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <Pressable onPress={() => { setError(null); setLoading(true); webRef.current?.reload(); }} style={styles.retryBtn}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            key={target.key}
            ref={webRef}
            source={{ uri: target.uri }}
            style={styles.web}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => setError(e.nativeEvent.description || 'Tidak dapat memuat halaman.')}
            onHttpError={(e) => setError('Server merespons: HTTP ' + e.nativeEvent.statusCode)}
            onNavigationStateChange={onNavigationStateChange}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            allowsBackForwardNavigationGestures
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#064e3b',
    paddingTop: Constants.statusBarHeight,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#064e3b',
    gap: 8,
  },
  title: {
    color: '#6ee7b7',
    fontSize: 16,
    fontWeight: '800',
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: '#065f46',
    borderRadius: 10,
    padding: 3,
  },
  segBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segBtnActive: {
    backgroundColor: '#10b981',
  },
  segText: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '700',
  },
  segTextActive: {
    color: '#fff',
  },
  reload: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reloadText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  webwrap: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  web: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  errorTitle: {
    color: '#fecaca',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorMsg: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});