const StockfishFactory = require('./node_modules/stockfish/src/stockfish-nnue-16-single.js');
console.log('StockfishFactory type:', typeof StockfishFactory);

const wasmBinary = require('fs').readFileSync('./node_modules/stockfish/src/stockfish-nnue-16-single.wasm');
const path = require('path');

// Try calling factory with config
const inst = StockfishFactory({
  wasmBinary,
  locateFile: (f) => path.join('./node_modules/stockfish/src/', f),
});

console.log('inst type:', typeof inst);
console.log('inst constructor:', inst && inst.constructor && inst.constructor.name);

if (inst && typeof inst === 'object') {
  console.log('has addMessageListener:', typeof inst.addMessageListener);
  console.log('has ready:', typeof inst.ready);
  console.log('has then:', typeof inst.then);
} else if (inst && typeof inst === 'function') {
  // Maybe we need to call it again?
  const inst2 = inst();
  console.log('inst2 type:', typeof inst2);
  console.log('inst2 keys:', inst2 ? Object.keys(inst2).slice(0,15) : null);
}

setTimeout(() => process.exit(0), 2000);
