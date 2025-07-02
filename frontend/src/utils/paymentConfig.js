export const UPI_CONFIG = {
  merchantId: "testcafe@upi",
  merchantName: "TestCafe Restaurant",
  merchantCategory: "RESTAURANT",
  terminalId: "REST001",
  // Customize these values according to your UPI setup
  supportedApps: [
    { name: 'Google Pay', scheme: 'gpay' },
    { name: 'PhonePe', scheme: 'phonepe' },
    { name: 'Paytm', scheme: 'paytm' },
    { name: 'BHIM', scheme: 'upi' }
  ]
};

export const QR_CONFIG = {
  size: 300,
  level: 'H', // High error correction level
  includeMargin: true,
  imageSettings: {
    src: '/logo192.png',
    height: 40,
    width: 40,
    excavate: true
  }
};

export const PAYMENT_VALIDATION = {
  timeoutSeconds: 300, // 5 minutes timeout for payment
  confirmationRequired: true,
  minimumAmount: 1,
  maximumAmount: 100000
};
