import { spawn, type ChildProcess } from 'node:child_process';
import { fileRoutes } from 'filesystem-routing/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import solid from '@solidjs/vite-plugin';
import { resolve } from 'node:path';

// Dev-only: boot the backend via entrypoint.sh (binary download, superuser
// bootstrap, env defaults, serve) alongside vite so `bun run dev` is the
// whole stack. Cleanup is belt-and-suspenders on purpose — closeBundle doesn't
// fire on every forced exit in all Vite versions, so process handlers back it
// up. Group kill (detached) so entrypoint children die with it.
let pbChild: ChildProcess | undefined;

function killPb(signal: NodeJS.Signals = 'SIGTERM') {
  if (!pbChild || pbChild.exitCode !== null || pbChild.killed) {
    pbChild = undefined;
    return;
  }
  try {
    if (pbChild.pid !== undefined && process.platform !== 'win32') {
      process.kill(-pbChild.pid, signal);
    } else {
      pbChild.kill(signal);
    }
  } catch {
    pbChild.kill(signal);
  }
  pbChild = undefined;
}

function pocketbaseDev(): Plugin {
  return {
    name: 'pocketbase-dev',
    apply: 'serve',
    configureServer() {
      if (pbChild) return; // singleton across config restarts
      const port = process.env.PB_PORT ?? '8090';
      pbChild = spawn('./entrypoint.sh', [], {
        stdio: 'inherit',
        detached: process.platform !== 'win32',
        env: { ...process.env, PB_PORT: port },
      });
      pbChild.on('error', (err) => {
        console.error(`[pocketbase-dev] failed to start (is entrypoint.sh executable?):`, err.message);
        pbChild = undefined;
      });
      // Exited with a code = failed to boot (e.g. address in use). Vite keeps running.
      pbChild.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`[pocketbase-dev] exited with code ${code} — vite keeps running; fix pocketbase and restart dev.`);
        }
        pbChild = undefined;
      });
    },
    closeBundle() {
      killPb();
    },
  };
}

process.on('SIGINT', () => killPb('SIGINT'));
process.on('SIGTERM', () => killPb('SIGTERM'));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Turnkey client mode: no index.html and no mount file — the plugin
  // generates the entries around src/App.tsx, wrapped in src/Document.tsx
  // (or a built-in shell). `vite build` prerenders the shell into
  // dist/client/index.html and emits a purely static dist/client.
  plugins: [
    // `extensions` makes @solidjs/vite-plugin also compile the `?pick=` route
    // modules the fileRoutes plugin emits (their ids end in a query string).
    solid({
      start: {
        devtools: false // disables the dev toolbar
      },
      extensions: ['.jsx', '.tsx'],
      diagnostics: true,
    }), // add `ssr: true` for streaming SSR
    fileRoutes({ types: true }),
    pocketbaseDev(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8090',
      '/_': 'http://localhost:8090',
    }
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest-setup.ts'],
    // if you have few tests, try commenting this
    // out to improve performance:
    isolate: false,
  },
  build: {
    target: 'esnext',
    // Keep images as asset files instead of inlining them into the JS bundle.
    assetsInlineLimit: 0,
  },
});
