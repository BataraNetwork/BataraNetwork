// scripts/clean.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const directoriesToClean = [
  'node_modules',
  'dist',
  '.turbo',
  'coverage',
  '.vercel'
];

const packagesDir = [
  'core/node',
  'core/cli',
  'explorer/frontend',
  'explorer/backend',
  'sdk/js',
  'api',
  '.' // root
];

console.log('🧹 Starting cleanup...');

for (const pkg of packagesDir) {
  const pkgPath = path.join(rootDir, pkg);
  if (fs.existsSync(pkgPath)) {
    for (const dir of directoriesToClean) {
      const dirPath = path.join(pkgPath, dir);
      if (fs.existsSync(dirPath)) {
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          console.log(`✅ Removed ${path.relative(rootDir, dirPath)}`);
        } catch (err) {
          console.error(`❌ Failed to remove ${path.relative(rootDir, dirPath)}:`, err);
        }
      }
    }
  }
}

console.log('🧼 Cleanup complete!');
