import QRCode from 'qrcode';

/**
 * Generates a base64 QR code image representing pass details.
 * @param {Object} data - The data to encode in the QR code.
 * @returns {Promise<string>} Base64 image string.
 */
export const generateQRCode = async (data) => {
  try {
    const stringifiedData = JSON.stringify(data);
    const qrCodeDataUrl = await QRCode.toDataURL(stringifiedData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#1e293b', // Slate 800
        light: '#ffffff'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code:', error.message);
    throw new Error('QR Code generation failed');
  }
};
