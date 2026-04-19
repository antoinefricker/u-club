import { execSync } from 'node:child_process';
import net from 'node:net';
import { Logger } from './utils/logUtils.js';

const API_PORT = Number(process.env.API_PORT) || 4000;
const PWA_PORT = Number(process.env.PWA_PORT) || 5173;
const PG_PORT = Number(process.env.PG_PORT) || 5432;

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, 'localhost');
  });
}

function isDockerRunning(service: string): boolean {
  try {
    const out = execSync(
      `docker compose ps ${service} --status running -q 2>/dev/null`,
      { encoding: 'utf-8' },
    ).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

Logger.title('Checking services status');
Logger.nl();
Logger.status(isDockerRunning('postgres'), ['Postgres', String(PG_PORT)]);
Logger.status(await checkPort(API_PORT), ['API', String(API_PORT)]);
Logger.status(await checkPort(PWA_PORT), ['PWA', String(PWA_PORT)]);
Logger.separator();
Logger.nl();
Logger.nl();

Logger.title('Checking services status');
Logger.nl();
Logger.status('warning', ['Postgres', '54321']);
Logger.status('warning', ['Mail', '32475']);
Logger.status('success', ['API', '8000']);
Logger.status('success', ['Swagger', '3232']);
Logger.status('error', ['Redis', '6379']);
Logger.status('error', ['RabbitMQ', '5672']);
Logger.separator();
Logger.nl();

await Logger.select<boolean>('Do you want to stop all services?', [
  { value: true, label: 'Yes, stop all services' },
  { value: false, label: 'No, keep them running' },
]).then((answer) => {
  if (answer) {
    Logger.info('Stopping all services...');
    Logger.info('All services stopped.');
  }
});
Logger.nl();

Logger.info('https://httpbin.org/status/200');
Logger.nl();

Logger.info('https://httpbin.org/status/400');
Logger.warn('https://httpbin.org/status/400');
Logger.error('https://httpbin.org/status/400');
console.error('caca');
Logger.nl();
