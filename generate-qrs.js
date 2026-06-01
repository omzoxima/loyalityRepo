const fs = require('fs');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const qrs = [
  { code: 'JAR-00101', size: '10L', dbSize: 'TENL' },
  { code: 'JAR-00102', size: '10L', dbSize: 'TENL' },
  { code: 'JAR-00201', size: '20L', dbSize: 'TWENTYL' },
  { code: 'JAR-00202', size: '20L', dbSize: 'TWENTYL' },
  { code: 'JAR-00203', size: '20L', dbSize: 'TWENTYL' },
];

async function downloadQR(url, fileName) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(fileName);
    https.get(url, function(response) {
      if (response.statusCode !== 200) {
        reject(new Error(`Server status: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', function(err) {
      fs.unlink(fileName, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('🔄 Connecting to database and resetting QR codes to ensure they are 100% fresh & unscanned...');
  
  for (const qr of qrs) {
    // 1. Delete any existing scans for this QR to prevent duplicates error
    await prisma.scan.deleteMany({
      where: { qrCode: qr.code },
    });

    // 2. Upsert the QR code record to make sure it exists with scanCount = 0
    await prisma.qrCode.upsert({
      where: { code: qr.code },
      update: {
        jarSize: qr.dbSize,
        scanCount: 0,
        firstScan: null,
      },
      create: {
        code: qr.code,
        jarSize: qr.dbSize,
        scanCount: 0,
        firstScan: null,
        batchId: 'BATCH-2026-FRESH',
      },
    });

    console.log(`✨ Database: ${qr.code} (${qr.size}) is reset & registered as unscanned!`);

    // 3. Generate the target scan URL pointing to the deployed site
    const targetUrl = `https://project-nlqr9.vercel.app/scan?qr=${qr.code}&size=${qr.size}`;
    const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=' + encodeURIComponent(targetUrl);
    const fileName = `${qr.code}-${qr.size}-qr.png`;

    try {
      await downloadQR(qrApiUrl, fileName);
      console.log(`📥 Downloaded scannable image: "${fileName}"`);
    } catch (err) {
      console.error(`❌ Failed to download QR image for ${qr.code}:`, err.message);
    }
  }

  console.log('\n🚀 Success! 5 fresh, scannable QR Code PNGs created and registered in the database!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => prisma.$disconnect());
