// IP Coğrafi Konum Servisi
let geoIPCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

const fetchGeoIP = async (ip) => {
  try {
    // ip-api.com kullan (ücretsiz, 45 istek/dakika)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`,
      {
        next: { revalidate: 3600 }, // 1 saat cache
      }
    );

    if (!response.ok) {
      throw new Error('GeoIP API hatası');
    }

    const data = await response.json();

    if (data.status === 'fail') {
      throw new Error(data.message || 'GeoIP lookup başarısız');
    }

    return {
      country: data.country || null,
      countryCode: data.countryCode || null,
      region: data.regionName || null,
      regionCode: data.region || null,
      city: data.city || null,
      timezone: data.timezone || null,
      isp: data.isp || null,
      lat: data.lat || null,
      lon: data.lon || null,
    };
  } catch (error) {
    console.error('[GeoIP] Error fetching for IP:', ip, error);
    return null;
  }
};

export const getGeoIPInfo = async (ip) => {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: 'Local',
      countryCode: 'LOCAL',
      region: null,
      regionCode: null,
      city: 'Local',
      timezone: null,
      isp: null,
    };
  }

  // Cache kontrolü
  const cached = geoIPCache[ip];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // GeoIP bilgisi çek
  const geoInfo = await fetchGeoIP(ip);

  if (geoInfo) {
    // Cache'e kaydet
    geoIPCache[ip] = {
      data: geoInfo,
      timestamp: Date.now(),
    };
    return geoInfo;
  }

  // Fallback - bilinmeyen IP
  return {
    country: null,
    countryCode: null,
    region: null,
    regionCode: null,
    city: null,
    timezone: null,
    isp: null,
  };
};

// Cache temizleme (eski cache'leri sil)
export const clearGeoIPCache = () => {
  const now = Date.now();
  Object.keys(geoIPCache).forEach((ip) => {
    if (now - geoIPCache[ip].timestamp > CACHE_DURATION) {
      delete geoIPCache[ip];
    }
  });
};

