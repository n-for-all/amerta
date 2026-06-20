import fs from 'fs';
import path from 'path';
import readline from 'readline';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

const createEnvFile = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Please enter your NEXT_PUBLIC_SERVER_URL (e.g., https://kopiluwak.ae): ', (url) => {
      rl.close(); 
      
      const serverUrl = url.trim() || 'http://localhost:3000';
      const randomPayloadSecret = crypto.randomBytes(24).toString('hex');
      const randomEncryptionSecret = crypto.randomBytes(24).toString('hex');
      
      const envContent = `# Database connection string
DATABASE_URL=mongodb://localhost:27017/amerta
# Used to encrypt JWT tokens
PAYLOAD_SECRET=${randomPayloadSecret}
# Used to encrypt general data in the database like order-received tokens
ENCRYPTION_SECRET=${randomEncryptionSecret}
# App base url, don't add ending slash
NEXT_PUBLIC_SERVER_URL=${serverUrl}

PAYLOAD_PUBLIC_DRAFT_SECRET=2121
PAYLOAD_ADMIN_ROUTE=/admin

REVALIDATION_KEY=2122
NEXT_PRIVATE_REVALIDATION_KEY=2122

ANALYZE=false
UNSPLASH_ACCESS_KEY=
NEXT_TELEMETRY_DISABLED=1
`;

      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file created successfully with URL: ' + serverUrl);
      resolve();
    });
  });
};

const checkEnv = async () => {
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env file not found.');
    await createEnvFile();
  } else {
    // Check if NEXT_PUBLIC_SERVER_URL is empty
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/^NEXT_PUBLIC_SERVER_URL=(.*)$/m);
    
    if (!urlMatch || !urlMatch[1].trim()) {
      console.warn('⚠️  NEXT_PUBLIC_SERVER_URL is missing or empty in .env.');
      await createEnvFile();
    }
  }
};

checkEnv();
