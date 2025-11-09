import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { createHash, getMerchantConfig } from '@/lib/paytr.js';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, merchantOid, orderIds, userName, userPhone, userEmail, userAddress, userIp } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Sepet boş' }, { status: 400 });
    }

    if (!merchantOid || !userName || !userPhone || !userEmail) {
      return NextResponse.json({ ok: false, error: 'Eksik bilgiler' }, { status: 400 });
    }

    const config = getMerchantConfig();

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const paymentAmount = Math.round(totalAmount * 100);

    const basketArray = items.map((item) => [
      item.title || 'Ürün',
      String(Math.round(parseFloat(item.price) * item.quantity * 100)), // Kuruş cinsinden
      String(item.quantity || 1),
    ]);
    const user_basket = Buffer.from(JSON.stringify(basketArray)).toString('base64');

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = userIp || forwarded?.split(',')[0] || realIp || '127.0.0.1';

    const currency = 'TL';
    const testMode = config.testMode;
    const timeoutLimit = '30';
    const lang = 'tr';
    const noInstallment = '0';
    const maxInstallment = '1';

    const hash = createHash(
      config.merchantId,
      clientIp,
      merchantOid,
      userEmail,
      String(paymentAmount),
      user_basket,
      noInstallment,
      maxInstallment,
      currency,
      testMode,
      config.merchantSalt,
      config.merchantKey
    );

    const hashString = `${config.merchantId}${clientIp}${merchantOid}${userEmail}${String(paymentAmount)}${user_basket}${noInstallment}${maxInstallment}${currency}${testMode}${config.merchantSalt}`;
    
    console.log('PayTR Hash Debug:', {
      hash_string_full: hashString,
      hash_string_length: hashString.length,
      hash_result: hash,
      hash_length: hash.length,
      merchant_id: config.merchantId,
      user_ip: clientIp,
      merchant_oid: merchantOid,
      email: userEmail,
      payment_amount: String(paymentAmount),
      user_basket: user_basket,
      user_basket_length: user_basket.length,
      currency: currency,
      test_mode: testMode,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      merchant_salt: config.merchantSalt,
      merchant_key: config.merchantKey.substring(0, 5) + '...',
    });

    const paytrBodyParams = {
      merchant_id: config.merchantId,
      user_ip: clientIp,
      merchant_oid: merchantOid,
      email: userEmail,
      payment_amount: String(paymentAmount),
      paytr_token: hash,
      user_name: userName,
      user_address: userAddress || '',
      user_phone: userPhone,
      user_basket: user_basket,
      currency,
      test_mode: testMode,
      timeout_limit: timeoutLimit,
      lang,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      merchant_ok_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/odeme/basarili`,
      merchant_fail_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/odeme/basarisiz`,
      debug_on: '1',
    };

    console.log('PayTR Params (merchant_key ve merchant_salt gönderilmiyor):', {
      merchant_id: config.merchantId,
      merchant_oid: merchantOid,
      payment_amount: String(paymentAmount),
      paytr_token: hash.substring(0, 20) + '...',
      user_basket: user_basket.substring(0, 50) + '...',
    });

    const paytrParams = new URLSearchParams();
    Object.entries(paytrBodyParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        paytrParams.append(key, String(value));
      }
    });

    console.log('PayTR Request Body Length:', paytrParams.toString().length);

    const requestBody = paytrParams.toString();
    console.log('PayTR Request URL:', 'https://www.paytr.com/odeme/api/get-token');
    console.log('PayTR Request Body (first 500 chars):', requestBody.substring(0, 500));

    const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: requestBody,
    });

    const responseText = await paytrResponse.text();
    console.log('PayTR Response Status:', paytrResponse.status);
    console.log('PayTR Response Headers:', Object.fromEntries(paytrResponse.headers.entries()));
    console.log('PayTR Response Text Length:', responseText.length);
    console.log('PayTR Response Text:', responseText);
    
    let paytrData;
    
    try {
      paytrData = JSON.parse(responseText);
      console.log('PayTR Parsed Data:', paytrData);
    } catch (parseError) {
      console.error('PayTR response parse error:', parseError.message);
      console.error('Raw response:', responseText);
      const errorMessage = responseText?.trim() || 'Boş yanıt alındı';
      console.error('PayTR Raw Error Response:', errorMessage);
      return NextResponse.json(
        {
          ok: false,
          error: `PayTR yanıt hatası: ${errorMessage}`,
        },
        { status: 400 }
      );
    }

    if (paytrData.status === 'success') {
      return NextResponse.json({
        ok: true,
        token: paytrData.token,
        merchantOid,
      });
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: paytrData.reason || paytrData.error || 'PayTR token alınamadı',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[/api/payment/create] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Ödeme başlatılamadı' }, { status: 500 });
  }
}

