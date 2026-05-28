// ADR-0001 Spike: UCI handshake test — CJS, nmrugg SF16 single-threaded
const path = require('path');

const sfDir = path.join(__dirname, 'node_modules/stockfish/src');
const wasmPath = path.join(sfDir, 'stockfish-nnue-16-single.wasm');
const nnuePath = path.join(sfDir, 'nn-5af11540bbfe.nnue');

async function runTest(label, useNNUE) {
  console.log(`\n=== ${label} (Use NNUE: ${useNNUE}) ===`);
  const startTime = Date.now();

  const modKey = Object.keys(require.cache).find(k => k.includes('stockfish-nnue-16-single.js'));
  if (modKey) delete require.cache[modKey];
  const STOCKFISH = require('./node_modules/stockfish/src/stockfish-nnue-16-single.js');
  const myLog = { log: () => {}, error: () => {}, warn: () => {} };

  const factory = STOCKFISH(myLog, wasmPath, true);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout 15s')), 15000);

    factory().then((sf) => {
      let uciok = false, readyok = false;

      sf.addMessageListener((line) => {
        if (typeof line !== 'string') return; // skip Error objects
        if (line.startsWith('info depth')) return;
        console.log(`  < ${line}`);
        if (line === 'uciok') {
          uciok = true;
          if (useNNUE) {
            // Point EvalFile to absolute path so Node.js XHR can find it
            sf.onCustomMessage(`setoption name EvalFile value ${nnuePath}`);
          }
          sf.onCustomMessage(`setoption name Use NNUE value ${useNNUE}`);
          sf.onCustomMessage('isready');
        }
        if (line === 'readyok') {
          readyok = true;
          console.log(`  Handshake OK in ${Date.now() - startTime}ms`);
          sf.onCustomMessage('position startpos');
          sf.onCustomMessage('go movetime 300');
        }
        if (line.startsWith('bestmove')) {
          clearTimeout(timeout);
          sf.terminate();
          resolve({ uciok, readyok, bestmove: line, ms: Date.now() - startTime });
        }
      });

      console.log('  > uci');
      sf.onCustomMessage('uci');
    }).catch(reject);
  });
}

(async () => {
  console.log('=== ADR-0001 HCE Spike: UCI Handshake ===');
  console.log(`Package: stockfish@16.0.0 (nmrugg)`);
  console.log(`WASM: ${path.basename(wasmPath)} (${(require('fs').statSync(wasmPath).size / 1024).toFixed(0)} KB raw)`);
  console.log(`NNUE: ${path.basename(nnuePath)} (${(require('fs').statSync(nnuePath).size / 1024 / 1024).toFixed(1)} MB raw)`);

  const r1 = await runTest('HCE mode', false).catch(e => ({ error: e.message }));
  console.log('\n[HCE]', r1.error ? `FAIL: ${r1.error}` : `PASS uciok=${r1.uciok} readyok=${r1.readyok} ${r1.bestmove} ${r1.ms}ms`);

  const r2 = await runTest('NNUE mode', true).catch(e => ({ error: e.message }));
  console.log('\n[NNUE]', r2.error ? `FAIL: ${r2.error}` : `PASS uciok=${r2.uciok} readyok=${r2.readyok} ${r2.bestmove} ${r2.ms}ms`);

  process.exit(0);
})();
