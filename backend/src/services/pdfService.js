import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure passes directory exists inside uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
const passesDir = path.join(uploadsDir, 'passes');
if (!fs.existsSync(passesDir)) {
  fs.mkdirSync(passesDir, { recursive: true });
}

/**
 * Generates a professional PDF Visitor Pass.
 * @param {Object} passDetails - Information about the pass.
 * @param {Object} visitor - Visitor document.
 * @param {Object} host - Host user document.
 * @param {Object} appointment - Appointment document.
 * @param {string} qrCodeBase64 - QR Code as base64 string.
 * @returns {Promise<string>} Path to the generated PDF.
 */
export const generatePassPDF = (passDetails, visitor, host, appointment, qrCodeBase64) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [300, 480],
        margins: { top: 15, bottom: 15, left: 15, right: 15 }
      });

      const fileName = `pass-${passDetails.passNumber}.pdf`;
      const filePath = path.join(passesDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header Block
      doc.rect(0, 0, 300, 75)
         .fill('#0f172a'); // Slate 900
      
      doc.fillColor('#ffffff')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('VISITOR PASS', 15, 20, { align: 'center' });

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#94a3b8') // Slate 400
         .text(passDetails.passNumber, 15, 45, { align: 'center' });

      // Visitor Image
      const photoWidth = 90;
      const photoHeight = 90;
      const photoX = 105; // (300 - 90) / 2
      const photoY = 90;

      let photoAdded = false;
      if (visitor.photo) {
        // Resolve absolute photo path
        const absolutePhotoPath = path.isAbsolute(visitor.photo) 
          ? visitor.photo 
          : path.join(uploadsDir, '..', visitor.photo); // Handles relative paths like "src/uploads/xxx" or just "uploads/xxx"
        
        let pathToCheck = absolutePhotoPath;
        // If file doesn't exist, check relative to root uploads
        if (!fs.existsSync(pathToCheck)) {
          pathToCheck = path.join(uploadsDir, path.basename(visitor.photo));
        }

        if (fs.existsSync(pathToCheck)) {
          try {
            doc.image(pathToCheck, photoX, photoY, {
              fit: [photoWidth, photoHeight],
              align: 'center',
              valign: 'center'
            });
            // Border around image
            doc.lineWidth(2)
               .strokeColor('#e2e8f0')
               .rect(photoX, photoY, photoWidth, photoHeight)
               .stroke();
            photoAdded = true;
          } catch (imgError) {
            console.error('PDFKit failed to embed visitor image:', imgError.message);
          }
        }
      }

      if (!photoAdded) {
        // Draw image placeholder
        doc.rect(photoX, photoY, photoWidth, photoHeight)
           .fillAndStroke('#f1f5f9', '#cbd5e1');
        doc.fillColor('#64748b')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text('PHOTO', photoX, photoY + 35, { width: photoWidth, align: 'center' })
           .text('NOT PROVIDED', photoX, photoY + 45, { width: photoWidth, align: 'center' });
      }

      // Details Block
      const detailsY = 200;
      doc.fillColor('#334155'); // Slate 700

      // Helper to draw metadata fields
      const drawField = (label, val, y) => {
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#64748b') // Label color
           .text(label, 15, y, { width: 85, align: 'right' });
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#0f172a') // Value color
           .text(val || 'N/A', 110, y, { width: 175 });
      };

      drawField('Visitor Name:', visitor.fullName, detailsY);
      drawField('Company:', visitor.company || 'Private/None', detailsY + 16);
      drawField('Host Name:', host.name, detailsY + 32);
      drawField('Department:', host.department || 'General', detailsY + 48);
      
      const formattedDate = new Date(appointment.visitDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ` @ ${appointment.visitTime}`;
      drawField('Scheduled Visit:', formattedDate, detailsY + 64);
      
      const expiryFormatted = passDetails.expiryDate 
        ? new Date(passDetails.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Same Day';
      drawField('Valid Until:', expiryFormatted, detailsY + 80);

      // QR Code
      try {
        const qrImageBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const qrSize = 80;
        doc.image(qrImageBuffer, 110, detailsY + 100, {
          width: qrSize,
          height: qrSize
        });
      } catch (qrError) {
        console.error('Failed to embed QR code in PDF:', qrError.message);
        doc.rect(110, detailsY + 100, 80, 80)
           .fillAndStroke('#f1f5f9', '#cbd5e1');
        doc.fillColor('#dc2626')
           .fontSize(8)
           .text('QR ERROR', 110, detailsY + 135, { width: 80, align: 'center' });
      }

      // Footer
      doc.rect(0, 460, 300, 20)
         .fill('#0f172a');
      
      doc.fillColor('#94a3b8')
         .fontSize(6)
         .font('Helvetica')
         .text('PLEASE WEAR THIS BADGE AT ALL TIMES - VISITOR PASS SYSTEM', 0, 467, { width: 300, align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        // Return relative path for storage efficiency and flexibility
        const relativePath = path.relative(path.join(uploadsDir, '..'), filePath);
        resolve(relativePath.replace(/\\/g, '/')); // Use forward slashes
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
