import { execSync } from 'node:child_process';
import net from 'node:net';
import { log, intro } from '@clack/prompts';
import { emojis } from './emojis.js';

const API_PORT = Number(process.env.API_PORT) || 4000;
const PWA_PORT = Number(process.env.PWA_PORT) || 5173;
const PG_PORT = 5432;

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

async function status() {
  intro('SERVICE STATUS');

  const postgresUp = isDockerRunning('postgres');
  const apiUp = await checkPort(API_PORT);
  const pwaUp = await checkPort(PWA_PORT);

  const icon = (up: boolean) => (up ? emojis.statusGreen : emojis.statusRed);

  log.info(`${icon(postgresUp)} Postgres .... ${PG_PORT}`);
  log.info(`${icon(apiUp)} API ......... ${API_PORT}`);
  log.info(`${icon(pwaUp)} PWA ......... ${PWA_PORT}`);
}

status();
