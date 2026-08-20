import { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const getLanHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  return hostUri.split(':')[0] || '10.0.2.2';
};

const TARGETS = [
  { key: 'local', label: 'Lokal' },
  { key: 'online', label: 'Online' },
];

const ONLINE_URI = 'https://hadirtadz.vercel.app/login';

function buildLocalUri(host) {
  return `http://${host}:3000/login`;
}

export default function App() {
  const webRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const retryTimer = useRef(null);

  const [host] = useState(getLanHost);
  const [target, setTarget] = useState(() => ({ ...TARGETS[0], uri: buildLocalUri(host) }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCountdown(0);
    if (retryTimer.current) clearInterval(retryTimer.current);
    webRef.current?.reload();
  }, []);

  const switchTarget = useCallback((t) => {
    setError(null);
    setLoading(true);
    setRetryCountdown(0);
    if (retryTimer.current) clearInterval(retryTimer.current);
    const uri = t.key === 'local' ? buildLocalUri(host) : ONLINE_URI;
    setTarget({ ...t, uri });
  }, [host]);

  // Auto-retry on error: countdown 5s then reload
  useEffect(() => {
    if (!error) {
      setRetryCountdown(0);
      if (retryTimer.current) clearInterval(retryTimer.current);
      return;
    }
    setRetryCountdown(5);
    retryTimer.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(retryTimer.current);
          setError(null);
          setLoading(true);
          setTimeout(() => webRef.current?.reload(), 200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (retryTimer.current) clearInterval(retryTimer.current); };
  }, [error]);

  // Re-detect IP and reload when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const newHost = getLanHost();
        if (newHost !== host) {
          setError(null);
          setLoading(true);
          const uri = target.key === 'local' ? buildLocalUri(newHost) : ONLINE_URI;
          setTarget((prev) => ({ ...prev, uri }));
        } else {
          reload();
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [host, target.key, reload]);

  const onNavigationStateChange = (nav) => {
    if (error) { setLoading(true); setError(null); }
    const url = nav.url;
    const internalHost =
      url.startsWith(`http://${host}`) ||
      url.startsWith('http://10.0.2.2') ||
      url.startsWith('http://localhost') ||
      url.startsWith('https://hadirtadz.vercel.app');
    if (!internalHost && (url.startsWith('http') || url.startsWith('wa.me') || url.startsWith('https://wa.me'))) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
        <Pressable onPress={reload} style={styles.reload}>
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
            {retryCountdown > 0 ? (
              <Text style={styles.countdownText}>Coba lagi dalam {retryCountdown} detik...</Text>
            ) : (
              <Pressable onPress={reload} style={styles.retryBtn}>
                <Text style={styles.retryText}>Coba Lagi</Text>
              </Pressable>
            )}
            <Text style={styles.hintText}>Pastikan PC dan HP di WiFi yang sama</Text>
          </View>
        ) : (
          <WebView
            key={target.uri}
            ref={webRef}
            source={{ uri: target.uri }}
            style={styles.web}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => setError(e.nativeEvent.description || 'Tidak dapat memuat halaman.')}
            onHttpError={(e) => {
              const code = e.nativeEvent.statusCode;
              if (code >= 400) setError('Server merespons: HTTP ' + code);
            }}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#064e3b' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#064e3b', gap: 6 },
  title: { color: '#6ee7b7', fontSize: 14, fontWeight: '800' },
  seg: { flexDirection: 'row', backgroundColor: '#065f46', borderRadius: 8, padding: 2 },
  segBtn: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  segBtnActive: { backgroundColor: '#10b981' },
  segText: { color: '#a7f3d0', fontSize: 10.5, fontWeight: '700' },
  segTextActive: { color: '#fff' },
  reload: { paddingHorizontal: 8, paddingVertical: 4 },
  reloadText: { color: '#6ee7b7', fontSize: 9.5, fontWeight: '600', textDecorationLine: 'underline' },
  webwrap: { flex: 1, backgroundColor: '#0f172a' },
  web: { flex: 1, backgroundColor: '#0f172a' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  errorTitle: { color: '#fecaca', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  errorMsg: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  countdownText: { color: '#6ee7b7', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  hintText: { color: '#64748b', fontSize: 11, marginTop: 16, textAlign: 'center' },
});
