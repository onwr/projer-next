import { NextResponse } from 'next/server';

// Cache için global değişken
let cachedRate = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

const fetchExchangeRate = async () => {
  try {
    // TCMB API'den USD/TRY kurunu çek
    const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      next: { revalidate: 300 }, // 5 dakika cache
    });
    
    if (!response.ok) {
      throw new Error('TCMB API hatası');
    }
    
    const xmlText = await response.text();
    
    // XML parse et - USD için Currency element'ini bul
    const usdMatch = xmlText.match(/<Currency[^>]*Kod="USD"[^>]*>([\s\S]*?)<\/Currency>/);
    if (!usdMatch) {
      throw new Error('USD kuru bulunamadı');
    }
    
    // ForexBuying değerini al
    const forexBuyingMatch = usdMatch[1].match(/<ForexBuying>([^<]+)<\/ForexBuying>/);
    if (!forexBuyingMatch) {
      throw new Error('ForexBuying bulunamadı');
    }
    
    const rate = parseFloat(forexBuyingMatch[1].trim());
    if (isNaN(rate) || rate <= 0) {
      throw new Error('Geçersiz kur değeri');
    }
    
    return rate;
  } catch (error) {
    console.error('TCMB API hatası:', error);
    
    // Fallback: exchangerate-api kullan
    try {
      const fallbackResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        next: { revalidate: 300 },
      });
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const tryRate = data.rates?.TRY;
        if (tryRate && tryRate > 0) {
          return tryRate;
        }
      }
    } catch (fallbackError) {
      console.error('Fallback API hatası:', fallbackError);
    }
    
    // Son fallback: Sabit kur
    return 35.0;
  }
};

export async function GET() {
  try {
    const now = Date.now();
    
    // Cache kontrolü
    if (cachedRate && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({
        ok: true,
        rate: cachedRate,
        cached: true,
        source: 'cache',
      });
    }
    
    // Yeni kur çek
    const rate = await fetchExchangeRate();
    
    // Cache'e kaydet
    cachedRate = rate;
    cacheTime = now;
    
    return NextResponse.json({
      ok: true,
      rate,
      cached: false,
      source: 'live',
    });
  } catch (error) {
    console.error('[/api/exchange-rate] Error:', error);
    
    // Hata durumunda cache'deki değeri döndür veya fallback kur
    const fallbackRate = cachedRate || 35.0;
    
    return NextResponse.json({
      ok: true,
      rate: fallbackRate,
      cached: !!cachedRate,
      source: cachedRate ? 'cache' : 'fallback',
      error: error.message,
    });
  }
}
