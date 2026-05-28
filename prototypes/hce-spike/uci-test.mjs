// ADR-0001 Spike: UCI handshake test for stockfish single-threaded WASM (Node.js)
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const sfDir = join(__dirname, 'node_modules/stockfish/src');

async function runTest(label, useNNUE) {
  console.log(`\n=== ${label} (Use NNUE: ${useNNUE}) ===`);
  const startTime = Date.now();

  // Each test needs a fresh require — use a worker-style invocation
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout 10s')), 10000);

    // The SF single-threaded module exports the instance directly when required
    // We need to clear require cache to get a fresh instance per test
    const modPath = require.resolve('./node_modules/stockfish/src/stockfish-nnue-16-single.js');
    delete require.cache[modPath];
    const sf = require('./node_modules/stockfish/src/stockfish-nnue-16-single.js');

    let uciok = false, readyok = false;

    sf.addMessageListener((line) => {
      if (line.startsWith('info depth') || line.startsWith('info string')) return; // skip noise
      console.log(`  < ${line}`);
      if (line === 'uciok') {
        uciok = true;
        sf.postMessage(`setoption name Use NNUE value ${useNNUE}`);
        sf.postMessage('isready');
      }
      if (line === 'readyok') {
        readyok = true;
        console.log(`  Handshake OK in ${Date.now() - startTime}ms`);
        sf.postMessage('position startpos');
        sf.postMessage('go movetime 300');
      }
      if (line.startsWith('bestmove')) {
        clearTimeout(timeout);
        sf.terminate();
        resolve({ uciok, readyok, bestmove: line, ms: Date.now() - startTime });
      }
    });

    sf.ready.then(() => {
      console.log('  > uci');
      sf.postMessage('uci');
    }).catch(reject);
  });
}

console.log('=== ADR-0001 HCE Spike: UCI handshake ===');
console.log('Package: stockfish@16.0.0 (nmrugg)');
console.log('Build: stockfish-nnue-16-single (single-threaded, no SharedArrayBuffer)');

const r1 = await runTest('HCE mode', false).catch(e => ({ error: e.message }));
console.log('\nHCE result:', r1);

const r2 = await runTest('NNUE mode', true).catch(e => ({ error: e.message }));
console.log('\nNNUE result:', r2);
