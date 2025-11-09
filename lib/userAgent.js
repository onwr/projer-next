import { UAParser } from 'ua-parser-js';

export const parseUserAgent = (userAgentString) => {
  if (!userAgentString) {
    return {
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      device: null,
    };
  }

  try {
    const parser = new UAParser(userAgentString);
    const result = parser.getResult();

    // Tarayıcı
    const browser = result.browser.name || null;
    const browserVersion = result.browser.version || null;

    // İşletim sistemi
    const os = result.os.name || null;
    const osVersion = result.os.version || null;

    // Cihaz tipi
    let device = 'Desktop';
    if (result.device.type === 'mobile') {
      device = 'Mobile';
    } else if (result.device.type === 'tablet') {
      device = 'Tablet';
    } else if (result.device.type === 'embedded' || result.device.type === 'smarttv') {
      device = 'Other';
    }

    return {
      browser,
      browserVersion,
      os,
      osVersion,
      device,
    };
  } catch (error) {
    console.error('[UserAgent] Parse error:', error);
    return {
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      device: 'Unknown',
    };
  }
};

