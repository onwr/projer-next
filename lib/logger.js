import { prisma } from './prisma.js';
import { getGeoIPInfo } from './geoip.js';
import { parseUserAgent } from './userAgent.js';

// IP adresini request'ten çek
export const getClientIP = (request) => {
  try {
    const forwarded = request.headers?.get('x-forwarded-for');
    const realIP = request.headers?.get('x-real-ip');
    const cfConnectingIP = request.headers?.get('cf-connecting-ip'); // Cloudflare

    if (forwarded) {
      const ips = forwarded.split(',').map((ip) => ip.trim());
      return ips[0] || 'unknown';
    }

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    if (realIP) {
      return realIP;
    }

    return 'unknown';
  } catch (error) {
    console.error('[Logger] Error getting IP:', error);
    return 'unknown';
  }
};

// Referer'ı al
export const getReferer = (request) => {
  try {
    return request.headers?.get('referer') || request.headers?.get('referrer') || null;
  } catch (error) {
    return null;
  }
};

// URL'i al
export const getURL = (request) => {
  try {
    return request.url || null;
  } catch (error) {
    return null;
  }
};

// User Agent'ı al
export const getUserAgent = (request) => {
  try {
    return request.headers?.get('user-agent') || null;
  } catch (error) {
    return null;
  }
};

// Aktivite logu kaydet (async, non-blocking)
export const createActivityLog = async ({
  action,
  entityType = null,
  entityId = null,
  userId = null,
  description,
  request = null,
  metadata = null,
}) => {
  try {
    // Request bilgilerini çek
    const ipAddress = request ? getClientIP(request) : 'unknown';
    const userAgent = request ? getUserAgent(request) : null;
    const referer = request ? getReferer(request) : null;
    const url = request ? getURL(request) : null;

    // User agent'ı parse et
    const uaInfo = parseUserAgent(userAgent);

    // IP'den coğrafi konum bul (non-blocking - hızlı olsun diye await etmeden devam ediyoruz)
    let geoInfo = {
      country: null,
      countryCode: null,
      region: null,
      regionCode: null,
      city: null,
      timezone: null,
      isp: null,
    };

    // GeoIP bilgisini çek (non-blocking promise - log kaydı gecikmesin)
    const geoPromise = getGeoIPInfo(ipAddress).catch(() => geoInfo);

    // Log kaydını oluştur (GeoIP bilgisi gelmeden önce)
    const logData = {
      action,
      entityType,
      entityId,
      userId,
      description: description || `${action} işlemi gerçekleştirildi`,
      ipAddress,
      userAgent,
      browser: uaInfo.browser,
      browserVersion: uaInfo.browserVersion,
      os: uaInfo.os,
      osVersion: uaInfo.osVersion,
      device: uaInfo.device,
      referer,
      url,
      metadata: metadata ? JSON.stringify(metadata) : null,
      country: null, // İlk başta null, sonra güncellenecek
      countryCode: null,
      region: null,
      regionCode: null,
      city: null,
      timezone: null,
      isp: null,
    };

    // Log kaydını oluştur
    const activityLog = await prisma.activityLog.create({
      data: logData,
    });

    // GeoIP bilgisi geldiğinde güncelle (async, non-blocking)
    geoPromise
      .then((info) => {
        if (info && (info.country || info.city)) {
          prisma.activityLog
            .update({
              where: { id: activityLog.id },
              data: {
                country: info.country,
                countryCode: info.countryCode,
                region: info.region,
                regionCode: info.regionCode,
                city: info.city,
                timezone: info.timezone,
                isp: info.isp,
              },
            })
            .catch(() => {
              // Hata durumunda sessizce geç
            });
        }
      })
      .catch(() => {
        // Hata durumunda sessizce geç
      });
  } catch (error) {
    // Log kaydetme hatası sistemin çalışmasını engellememeli
    console.error('[Logger] Error creating activity log:', error);
  }
};

// Hızlı log kaydetme (sadece temel bilgiler)
export const createQuickLog = async (action, description, userId = null, request = null) => {
  await createActivityLog({
    action,
    description,
    userId,
    request,
  });
};

