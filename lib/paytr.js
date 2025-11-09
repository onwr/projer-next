import crypto from 'crypto';

const getMerchantConfig = () => ({
  merchantId: process.env.PAYTR_MERCHANT_ID || '562602',
  merchantKey: process.env.PAYTR_MERCHANT_KEY || 'x6eg7EstrktABFua',
  merchantSalt: process.env.PAYTR_MERCHANT_SALT || '3km85wHuLJe2d8t2',
  testMode: process.env.PAYTR_TEST_MODE || '1',
});

export const createHash = (merchantId, userIp, merchantOid, email, paymentAmount, userBasket, noInstallment, maxInstallment, currency, testMode, merchantSalt, merchantKey) => {
  const hashString = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}${merchantSalt}`;
  const hash = crypto.createHmac('sha256', merchantKey).update(hashString, 'utf8').digest('base64');
  return hash;
};

export const verifyCallbackHash = (merchantOid, status, totalAmount, merchantSalt, merchantKey, hash) => {
  const hashString = `${merchantOid}${merchantSalt}${status}${totalAmount}${merchantKey}`;
  const calculatedHash = crypto.createHash('sha256').update(hashString).digest('base64');
  return calculatedHash === hash;
};

export { getMerchantConfig };

