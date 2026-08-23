import { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const getLanHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  return hostUri.split(':')[0] || '';
};

const ONLINE_URI = 'https://hadirtadz.vercel.app/login';
const PORTS = [80, 8000, 8080, 8081, 3000, 5000];
const APP_PATH = '/absensi_digital/auth/login.php';

function buildLocalUri(host, port) {
  if (port && port !== 80) return `http://${host}:${port}${APP_PATH}`;
  return `http://${host}${APP_PATH}`;
}

export default function App() {
  const webRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const retryTimer = useRef(null);

  const [host] = useState(getLanHost);
  const [port, setPort] = useState('80');
  const [customHost, setCustomHost] = useState('');
  const [target, setTarget] = useState(() => ({ key: 'local', uri: buildLocalUri(host, 80) }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const effectiveHost = customHost.trim() || host;

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCountdown(0);
    if (retryTimer.current) clearInterval(retryTimer.current);
    const uri = buildLocalUri(effectiveHost, parseInt(port, 10) || 80);
    setTarget((prev) => ({ ...prev, uri }));
  }, [effectiveHost, port]);

  const switchToOnline = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCountdown(0);
    setShowSettings(false);
    if (retryTimer.current) clearInterval(retryTimer.current);
    setTarget({ key: 'online', uri: ONLINE_URI });
  }, []);

  const switchToLocal = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCountdown(0);
    setShowSettings(false);
    if (retryTimer.current) clearInterval(retryTimer.current);
    const uri = buildLocalUri(effectiveHost, parseInt(port, 10) || 80);
    setTarget({ key: 'local', uri });
  }, [effectiveHost, port]);

  // Auto-retry on error
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

  // Re-detect IP on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const newHost = getLanHost();
        if (newHost !== host) {
          setError(null);
          setLoading(true);
          const uri = target.key === 'local' ? buildLocalUri(newHost, parseInt(port, 10) || 80) : ONLINE_URI;
          setTarget((prev) => ({ ...prev, uri }));
        } else {
          reload();
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [host, target.key, reload, port]);

  const onNavigationStateChange = (nav) => {
    if (error) { setLoading(true); setError(null); }
    const url = nav.url;
    const internalHost =
      url.startsWith(`http://${effectiveHost}`) ||
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
            <Pressable
              onPress={switchToLocal}
              style={[styles.segBtn, target.key === 'local' && styles.segBtnActive]}
            >
              <Text style={[styles.segText, target.key === 'local' && styles.segTextActive]}>Lokal</Text>
            </Pressable>
            <Pressable
              onPress={switchToOnline}
              style={[styles.segBtn, target.key === 'online' && styles.segBtnActive]}
            >
              <Text style={[styles.segText, target.key === 'online' && styles.segTextActive]}>Online</Text>
            </Pressable>
          </View>
          <Pressable onPress={reload} style={styles.reload}>
            <Text style={styles.reloadText}>Muat Ulang</Text>
          </Pressable>
        </View>

        <View style={styles.webwrap}>
          {loading && !error && (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          )}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Gagal Terhubung</Text>
              <Text style={styles.errorMsg}>{error}</Text>
              <Text style={styles.urlText}>{target.uri}</Text>

              <View style={styles.diagBox}>
                <Text style={styles.diagLabel}>IP PC: {host || '(tidak terdeteksi)'}</Text>
              </View>

              {retryCountdown > 0 && (
                <Text style={styles.countdownText}>Coba lagi dalam {retryCountdown} detik...</Text>
              )}

              {!showSettings ? (
                <View style={styles.btnGroup}>
                  <Pressable onPress={reload} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Coba Lagi</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
                    <Text style={styles.settingsText}>Setel URL</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.settingsForm}>
                  <Text style={styles.formLabel}>IP / Host PC:</Text>
                  <TextInput
                    style={styles.input}
                    value={customHost}
                    onChangeText={setCustomHost}
                    placeholder={host || '192.168.x.x'}
                    placeholderTextColor="#475569"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.formLabel}>Port:</Text>
                  <TextInput
                    style={styles.input}
                    value={port}
                    onChangeText={setPort}
                    placeholder="80"
                    placeholderTextColor="#475569"
                    keyboardType="number-pad"
                  />
                  <View style={styles.portRow}>
                    {PORTS.map((p) => (
                      <Pressable
                        key={p}
                        onPress={() => setPort(String(p))}
                        style={[styles.portChip, port === String(p) && styles.portChipActive]}
                      >
                        <Text style={[styles.portChipText, port === String(p) && styles.portChipTextActive]}>{p}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable onPress={() => { setShowSettings(false); reload(); }} style={styles.applyBtn}>
                    <Text style={styles.applyText}>Terapkan</Text>
                  </Pressable>
                </View>
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
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#0f172a' },
  errorTitle: { color: '#fecaca', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  errorMsg: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  urlText: { color: '#6ee7b7', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginBottom: 12, backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  diagBox: { backgroundColor: '#1e293b', borderRadius: 8, padding: 10, marginBottom: 12, width: '100%' },
  diagLabel: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
  btnGroup: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  retryBtn: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  settingsBtn: { backgroundColor: '#334155', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  settingsText: { color: '#e2e8f0', fontWeight: '700', fontSize: 14 },
  settingsForm: { width: '100%', backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 8 },
  formLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 4, marginTop: 6 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, paddingHorizontal: 12, paddingVertical: 8 },
  portRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  portChip: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  portChipActive: { backgroundColor: '#10b981' },
  portChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  portChipTextActive: { color: '#fff' },
  applyBtn: { backgroundColor: '#10b981', borderRadius: 8, paddingVertical: 10, marginTop: 10, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  countdownText: { color: '#6ee7b7', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  hintText: { color: '#64748b', fontSize: 11, marginTop: 12, textAlign: 'center' },
});
