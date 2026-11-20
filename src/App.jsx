import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('sim_apiKey') || '');
  const [tenantName, setTenantName] = useState(localStorage.getItem('sim_tenantName') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('sim_apiKey'));

  // Genişletilmiş Simülasyon Form State'leri
  const [code, setCode] = useState('TRK-005');
  const [label, setLabel] = useState('Anlık Konum Sinyali');
  const [definition, setDefinition] = useState('Soğuk zincir sevkiyat takibi');
  const [unit, setUnit] = useState('Lojistik Operasyonları');
  const [firm, setFirm] = useState('Santafe Lojistik A.Ş.');
  const [branch, setBranch] = useState('Anadolu Yakası Aktarma');
  const [latitude, setLatitude] = useState(41.0082);
  const [longitude, setLongitude] = useState(28.9784);
  const [country, setCountry] = useState('Türkiye');
  const [region, setRegion] = useState('Marmara Bölgesi');
  const [city, setCity] = useState('İstanbul');
  const [address, setAddress] = useState('İkitelli Organize Sanayi Bölgesi');
  const [postalcode, setPostalcode] = useState('34306');
  
  const [logs, setLogs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoRunRef = useRef(null);

  // Giriş Yapma
  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    try {
      const res = await axios.get(`${API_URL}/me`, {
        headers: { 'X-API-Key': cleanKey }
      });
      setApiKey(cleanKey);
      setTenantName(res.data.name);
      localStorage.setItem('sim_apiKey', cleanKey);
      localStorage.setItem('sim_tenantName', res.data.name);
      setIsLoggedIn(true);
    } catch (err) {
      localStorage.removeItem('sim_apiKey');
      localStorage.removeItem('sim_tenantName');
      alert(`Geçersiz API Key veya bağlantı hatası! (${API_URL})`);
    }
  };

  const handleLogout = () => {
    stopAutoSimulation();
    localStorage.removeItem('sim_apiKey');
    localStorage.removeItem('sim_tenantName');
    setIsLoggedIn(false);
    setApiKey('');
  };

  // Tekil Veri Gönderim Fonksiyonu (Promise döndürür)
  const sendNodeToAPI = async () => {
    const cleanKey = apiKey.trim();
    try {
      const payload = {
        code,
        label,
        definition,
        transaction_id: 'TXN-SIM-' + Math.floor(Math.random() * 100000),
        unit,
        firm,
        branch,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        country,
        region,
        city,
        address,
        postalcode,
        event_date: new Date().toISOString()
      };

      await axios.post(`${API_URL}/nodes`, payload, {
        headers: { 'X-API-Key': cleanKey }
      });

      const newLog = {
        time: new Date().toLocaleTimeString('tr-TR'),
        status: 'BAŞARILI',
        text: `${code} (${firm} - ${city}) -> (${latitude}, ${longitude}) gönderildi.`
      };
      setLogs(prev => [newLog, ...prev]);

      // Koordinatları hafifçe kaydırarak hareket simülasyonu yapalım
      setLatitude(prev => Number((prev + (Math.random() - 0.5) * 0.01).toFixed(4)));
      setLongitude(prev => Number((prev + (Math.random() - 0.5) * 0.01).toFixed(4)));

    } catch (error) {
      const statusCode = error.response?.status;
      const errLog = {
        time: new Date().toLocaleTimeString('tr-TR'),
        status: 'HATA',
        text: statusCode
          ? `HTTP ${statusCode}: ${error.response?.data?.detail || 'Yetki veya istek hatası!'}`
          : `Bağlantı hatası (${API_URL})`
      };
      setLogs(prev => [errLog, ...prev]);
    }
  };

  const handleManualSend = async () => {
    setIsSending(true);
    await sendNodeToAPI();
    setIsSending(false);
  };

  // Otomatik Simülasyonu Başlat / Durdur
  const toggleAutoSimulation = () => {
    if (isAutoRunning) {
      stopAutoSimulation();
    } else {
      startAutoSimulation();
    }
  };

  const startAutoSimulation = () => {
    setIsAutoRunning(true);
    autoRunRef.current = setInterval(async () => {
      await sendNodeToAPI();
    }, 3000); // Her 3 saniyede bir otomatik sinyal
  };

  const stopAutoSimulation = () => {
    setIsAutoRunning(false);
    if (autoRunRef.current) {
      clearInterval(autoRunRef.current);
      autoRunRef.current = null;
    }
  };

  // Bileşen kapandığında interval'i temizle
  useEffect(() => {
    return () => stopAutoSimulation();
  }, []);

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '60px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h2>Simülatör Giriş Paneli</h2>
        <p style={{ fontSize: '13px', color: '#666' }}>Spatial NodeBase API'sini beslemek için API anahtarınızı girin.</p>
        <p style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>Hedef API: {API_URL}</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
          <input 
            type="text" 
            placeholder="sn_... API Key" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            required 
          />
          <button type="submit" style={{ padding: '10px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            Simülatörü Başlat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <div>
          <h2>🚀 Spatial NodeBase Zengin Simülatörü</h2>
          <span style={{ fontSize: '13px', color: '#28a745', fontWeight: 'bold' }}>Bağlı Tenant: {tenantName}</span>
          <span style={{ fontSize: '11px', color: '#666', marginLeft: '10px', fontFamily: 'monospace' }}>({API_URL})</span>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 14px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}>
          Çıkış Yap
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        {/* Kontrol Paneli / Form */}
        <div style={{ flex: '1', minWidth: '350px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '600px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Sinyal Parametreleri</h3>
            <span style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: isAutoRunning ? '#d4edda' : '#e2e3e5', color: isAutoRunning ? '#155724' : '#383d41', borderRadius: '12px', fontWeight: 'bold' }}>
              {isAutoRunning ? '● Otomatik Mod Aktif' : '○ Manuel Mod'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Araç / Cihaz Kodu:</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Serbest Metin / Etiket (label):</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Detaylı Açıklama (definition):</label>
            <input type="text" value={definition} onChange={e => setDefinition(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Birim:</label>
            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Kurum / Firma:</label>
            <input type="text" value={firm} onChange={e => setFirm(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Şube / Departman:</label>
            <input type="text" value={branch} onChange={e => setBranch(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Enlem (Lat):</label>
            <input type="number" step="any" value={latitude} onChange={e => setLatitude(parseFloat(e.target.value))} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Boylam (Lng):</label>
            <input type="number" step="any" value={longitude} onChange={e => setLongitude(parseFloat(e.target.value))} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Şehir:</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Açık Adres:</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Posta Kodu:</label>
            <input type="text" value={postalcode} onChange={e => setPostalcode(e.target.value)} style={{ padding: '7px', fontSize: '12px' }} />

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button 
                onClick={handleManualSend} 
                disabled={isSending || isAutoRunning}
                style={{ flex: 1, padding: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: (isSending || isAutoRunning) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                {isSending ? 'Gönderiliyor...' : '📡 Tek Sinyal'}
              </button>

              <button 
                onClick={toggleAutoSimulation}
                style={{ flex: 1.5, padding: '10px', backgroundColor: isAutoRunning ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                {isAutoRunning ? '⏹ Otomatiği Durdur' : '▶ Otomatiği Başlat'}
              </button>
            </div>
          </div>
        </div>

        {/* Canlı Log Ekranı */}
        <div style={{ flex: '1.2', minWidth: '350px', backgroundColor: '#1e1e1e', color: '#00ffcc', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', height: '600px', overflowY: 'auto' }}>
          <div style={{ borderBottom: '1px solid #444', paddingBottom: '8px', marginBottom: '10px', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>&gt; Canlı API Trafik Logları</span>
            <span>{logs.length} Sinyal</span>
          </div>
          {logs.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic', marginTop: '20px' }}>Henüz sinyal gönderilmedi. "Otomatiği Başlat" veya "Tek Sinyal" butonuna basın...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '6px', borderBottom: '1px dashed #333', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>[{log.time}]</span>{' '}
                <span style={{ color: log.status === 'BAŞARILI' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>{log.status}</span>:{' '}
                <span style={{ color: '#ddd' }}>{log.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}