/**
 * Centralized Application Configuration
 * Move hardcoded values into environment variables with sensible defaults.
 */
export const APP_CONFIG = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'DataEntry GSD Platform',
  appDescription: 'Web-based work management platform for typing and data-entry operations.',
  
  // Payment Config
  payment: {
    upiId: process.env.NEXT_PUBLIC_UPI_ID || 'dataentrywork@upi',
    feeAmount: Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE) || 500.00,
    currencySymbol: '₹',
    qrCodeImage: process.env.NEXT_PUBLIC_QR_CODE_URL || '/qr-placeholder.png',
  },

  // Upload limits
  uploads: {
    maxImageSizeBytes: 10 * 1024 * 1024, // 10MB
    maxZipSizeBytes: 100 * 1024 * 1024,  // 100MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedZipTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
      'application/vnd.rar',
      'application/x-rar-compressed',
      'application/x-rar',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/octet-stream',
    ],
    allowedArchiveExtensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'],
  },
}
