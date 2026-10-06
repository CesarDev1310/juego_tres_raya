/**
 * Pruebas unitarias y de simulación para Tres en Raya
 */
const {
  checkWinner,
  isBoardFull,
  getEmptyIndices,
  getEasyMove,
  getBestMove
} = require('./script.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASÓ: ${message}`);
    passedTests++;
  }
}

console.log('--- TEST 1: Verificación de Condiciones Ganadoras ---');
const boardRowWin = ['X', 'X', 'X', '', 'O', '', 'O', '', ''];
assert(checkWinner(boardRowWin, 'X') !== null, 'Detecta victoria horizontal para X');
assert(checkWinner(boardRowWin, 'O') === null, 'No declara ganador a O incorrectamente');

const boardColWin = ['O', 'X', '', 'O', 'X', '', 'O', '', ''];
assert(checkWinner(boardColWin, 'O') !== null, 'Detecta victoria vertical para O');

const boardDiagWin = ['X', 'O', 'O', '', 'X', '', '', '', 'X'];
assert(checkWinner(boardDiagWin, 'X') !== null, 'Detecta victoria diagonal para X');

console.log('\n--- TEST 2: Detección de Tablero Lleno / Empate ---');
const fullBoard = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
assert(isBoardFull(fullBoard) === true, 'Detecta tablero completamente lleno');
assert(checkWinner(fullBoard, 'X') === null && checkWinner(fullBoard, 'O') === null, 'El tablero lleno es un empate sin ganador');

const emptyBoard = Array(9).fill('');
assert(isBoardFull(emptyBoard) === false, 'Tablero vacío no está lleno');

console.log('\n--- TEST 3: La IA aprovecha jugada ganadora inmediata ---');
// Tablero: O O _ en la primera fila, O debe ganar jugando en la casilla 2
const winOpportunity = [
  'O', 'O', '',
  'X', 'X', '',
  '', '', ''
];
const moveWin = getBestMove(winOpportunity, 'O', 'X');
assert(moveWin === 2, `La IA debe jugar 2 para ganar de inmediato (jugó ${moveWin})`);

console.log('\n--- TEST 4: La IA bloquea victoria inmediata del humano ---');
// Tablero: X X _ en la fila superior, la IA debe bloquear jugando en la casilla 2
const blockOpportunity = [
  'X', 'X', '',
  'O', '', '',
  '', '', ''
];
const moveBlock = getBestMove(blockOpportunity, 'O', 'X');
assert(moveBlock === 2, `La IA debe bloquear al humano en la casilla 2 (jugó ${moveBlock})`);

console.log('\n--- TEST 5: Simulación de 200 partidas contra movimientos aleatorios ---');
let aiWins = 0;
let aiLosses = 0;
let aiDraws = 0;

for (let game = 0; game < 200; game++) {
  let simBoard = Array(9).fill('');
  let currentSimPlayer = 'X'; // El rival aleatorio empieza
  let gameOver = false;

  while (!gameOver) {
    if (currentSimPlayer === 'X') {
      // Rival juega aleatoriamente
      const emptySlots = getEmptyIndices(simBoard);
      const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      simBoard[randomSlot] = 'X';
    } else {
      // IA juega con Minimax
      const bestSlot = getBestMove(simBoard, 'O', 'X');
      simBoard[bestSlot] = 'O';
    }

    if (checkWinner(simBoard, currentSimPlayer)) {
      gameOver = true;
      if (currentSimPlayer === 'O') aiWins++;
      else aiLosses++;
    } else if (isBoardFull(simBoard)) {
      gameOver = true;
      aiDraws++;
    } else {
      currentSimPlayer = currentSimPlayer === 'X' ? 'O' : 'X';
    }
  }
}

console.log(`Resultados de 200 partidas:`);
console.log(`- Victorias de la IA: ${aiWins}`);
console.log(`- Empates: ${aiDraws}`);
console.log(`- Derrotas de la IA: ${aiLosses}`);

assert(aiLosses === 0, 'La IA Minimax nunca debe perder una partida contra ningún movimiento');

console.log(`\n🎉 Todos los ${passedTests}/${totalTests} tests pasaron satisfactoriamente.`);
