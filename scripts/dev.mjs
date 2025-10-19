// scripts/dev.mjs
import { spawn } from 'child_process';
import os from 'os';
// FIX: Explicitly import 'process' to resolve type ambiguity for static analysis tools.
import process from 'process';

const services = [
  { name: 'Node', filter: 'bataranetwork-node', color: 'cyan' },
  { name: 'Explorer-BE', filter: 'explorer-backend', color: 'magenta' },
  { name: 'Explorer-FE', filter: 'explorer-frontend', color: 'blue' },
  { name: 'Dashboard', filter: 'bataranetwork-dashboard-monorepo', color: 'green' }
];

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
};

const processes = [];

services.forEach(service => {
  const command = os.platform() === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const args = ['--filter', service.filter, 'dev'];
  
  const child = spawn(command, args, { stdio: 'pipe' });

  const prefix = `${colors[service.color]}[${service.name.padEnd(12)}]${colors.reset}`;

  // FIX: Added a null check for child.stdout to prevent potential runtime errors
  // and satisfy strict type checking, addressing the 'property does not exist' error.
  if (child.stdout) {
    child.stdout.on('data', (data) => {
      process.stdout.write(`${prefix} ${data.toString().replace(/\n$/, '').split('\n').join(`\n${prefix} `)}\n`);
    });
  }

  // FIX: Added a null check for child.stderr to prevent potential runtime errors
  // and satisfy strict type checking, addressing the 'property does not exist' error.
  if (child.stderr) {
    child.stderr.on('data', (data) => {
      process.stderr.write(`${prefix} ${data.toString().replace(/\n$/, '').split('\n').join(`\n${prefix} `)}\n`);
    });
  }

  child.on('close', (code) => {
    console.log(`${prefix} exited with code ${code}`);
  });

  processes.push(child);
});

function cleanup() {
  console.log('Shutting down services...');
  processes.forEach(p => p.kill());
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
