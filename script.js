/**
 * Tres en Raya (Tic-Tac-Toe) - Lógica del Juego
 */

// Combinaciones ganadoras posibles
const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
  [0, 4, 8], [2, 4, 6]             // Diagonales
];

/**
 * Comprueba si un jugador ha ganado en el estado de tablero dado.
 * @param {Array<string>} board Estado de las 9 casillas
 * @param {string} player 'X' o 'O'
 * @returns {Array<number>|null} Combinación ganadora o null
 */
function checkWinner(board, player) {
  for (const combo of WINNING_COMBOS) {
    if (combo.every(idx => board[idx] === player)) {
      return combo;
    }
  }
  return null;
}

/**
 * Comprueba si el tablero está completamente lleno.
 * @param {Array<string>} board
 * @returns {boolean}
 */
function isBoardFull(board) {
  return board.every(cell => cell !== '');
}

/**
 * Obtiene los índices de las casillas vacías.
 * @param {Array<string>} board
 * @returns {Array<number>}
 */
function getEmptyIndices(board) {
  const indices = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') indices.push(i);
  }
  return indices;
}

/**
 * Movimiento aleatorio para la IA Fácil.
 * @param {Array<string>} board
 * @returns {number} Índice de la casilla seleccionada
 */
function getEasyMove(board) {
  const empty = getEmptyIndices(board);
  if (empty.length === 0) return -1;
  const randomIndex = Math.floor(Math.random() * empty.length);
  return empty[randomIndex];
}

/**
 * Algoritmo Minimax recursivo para evaluar el mejor movimiento.
 * @param {Array<string>} currentBoard
 * @param {string} player Jugador en el turno actual del árbol ('O' o 'X')
 * @param {number} depth Profundidad del árbol
 * @param {string} aiPlayer Símbolo de la IA ('O')
 * @param {string} humanPlayer Símbolo del humano ('X')
 * @returns {{ score: number, index?: number }}
 */
function minimax(currentBoard, player, depth, aiPlayer, humanPlayer) {
  // Evaluaciones terminales
  if (checkWinner(currentBoard, aiPlayer)) {
    return { score: 10 - depth };
  }
  if (checkWinner(currentBoard, humanPlayer)) {
    return { score: depth - 10 };
  }
  const availableMoves = getEmptyIndices(currentBoard);
  if (availableMoves.length === 0) {
    return { score: 0 };
  }

  const moves = [];

  for (let i = 0; i < availableMoves.length; i++) {
    const moveIndex = availableMoves[i];
    currentBoard[moveIndex] = player;

    const nextPlayer = player === aiPlayer ? humanPlayer : aiPlayer;
    const result = minimax(currentBoard, nextPlayer, depth + 1, aiPlayer, humanPlayer);

    moves.push({
      index: moveIndex,
      score: result.score
    });

    currentBoard[moveIndex] = ''; // Backtracking
  }

  // Si es el turno de la IA, maximizar; si es el humano, minimizar
  let bestMoveIndex = 0;
  if (player === aiPlayer) {
    let maxScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > maxScore) {
        maxScore = moves[i].score;
        bestMoveIndex = i;
      }
    }
  } else {
    let minScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < minScore) {
        minScore = moves[i].score;
        bestMoveIndex = i;
      }
    }
  }

  return moves[bestMoveIndex];
}

/**
 * Calcula la mejor jugada para la IA usando Minimax (Invencible).
 * @param {Array<string>} board
 * @param {string} aiPlayer
 * @param {string} humanPlayer
 * @returns {number}
 */
function getBestMove(board, aiPlayer = 'O', humanPlayer = 'X') {
  // Optimización inicial: si el tablero está vacío o solo hay 1 ficha, jugadas estratégicas rápidas
  const empty = getEmptyIndices(board);
  if (empty.length === 9) {
    // Si la IA fuera primera (por ejemplo casilla central o esquina)
    return 4;
  }
  const result = minimax([...board], aiPlayer, 0, aiPlayer, humanPlayer);
  return result.index !== undefined ? result.index : empty[0];
}

// -------------------------------------------------------------
// LÓGICA DE INTERFAZ Y CONTROL (CLIENTE / NAVEGADOR)
// -------------------------------------------------------------

if (typeof window !== 'undefined') {
  // Estado local del juego
  let board = Array(9).fill('');
  let currentPlayer = 'X';
  let isGameOver = false;
  let isAiThinking = false;
  let gameMode = 'pvp'; // 'pvp' | 'ai-easy' | 'ai-hard'
  let soundEnabled = true;

  const scores = {
    x: 0,
    o: 0,
    ties: 0
  };

  // Referencias al DOM
  const cells = document.querySelectorAll('.cell');
  const statusBanner = document.getElementById('status-banner');
  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreTiesEl = document.getElementById('score-ties');
  const labelOEl = document.getElementById('label-o');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const btnRestart = document.getElementById('btn-restart');
  const btnResetScores = document.getElementById('btn-reset-scores');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const soundIconEl = document.getElementById('sound-icon');

  // Inicialización de Web Audio API
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.1, delay = 0) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const startTime = audioCtx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Ignorar fallos de audio silenciosamente
    }
  }

  function playSound(effect) {
    if (!soundEnabled) return;
    if (effect === 'move-x') {
      playTone(520, 'sine', 0.08);
    } else if (effect === 'move-o') {
      playTone(380, 'sine', 0.08);
    } else if (effect === 'win') {
      playTone(523.25, 'triangle', 0.12, 0);       // C5
      playTone(659.25, 'triangle', 0.12, 0.1);     // E5
      playTone(783.99, 'triangle', 0.22, 0.2);     // G5
      playTone(1046.50, 'triangle', 0.35, 0.32);   // C6
    } else if (effect === 'tie') {
      playTone(400, 'sawtooth', 0.15, 0);
      playTone(320, 'sawtooth', 0.22, 0.12);
    } else if (effect === 'click') {
      playTone(300, 'sine', 0.04);
    }
  }

  // Cargar estado de almacenamiento local
  function loadPersistedData() {
    try {
      const savedScores = localStorage.getItem('tictactoe_scores');
      if (savedScores) {
        const parsed = JSON.parse(savedScores);
        scores.x = parsed.x || 0;
        scores.o = parsed.o || 0;
        scores.ties = parsed.ties || 0;
      }
      const savedSound = localStorage.getItem('tictactoe_sound');
      if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
      }
    } catch {
      // Usar valores por defecto si localStorage falla
    }
    updateScoreUI();
    updateSoundUI();
  }

  function savePersistedData() {
    try {
      localStorage.setItem('tictactoe_scores', JSON.stringify(scores));
      localStorage.setItem('tictactoe_sound', soundEnabled.toString());
    } catch {
      // Ignorar fallos de cuota o privacidad
    }
  }

  function updateScoreUI() {
    scoreXEl.textContent = scores.x;
    scoreOEl.textContent = scores.o;
    scoreTiesEl.textContent = scores.ties;
  }

  function updateSoundUI() {
    soundIconEl.textContent = soundEnabled ? '🔊' : '🔇';
    btnToggleSound.setAttribute('aria-label', soundEnabled ? 'Silenciar sonido' : 'Activar sonido');
  }

  function updateStatusBanner(text, customHtml = null) {
    if (customHtml) {
      statusBanner.innerHTML = customHtml;
    } else {
      statusBanner.textContent = text;
    }
  }

  function renderTurnBanner() {
    if (isGameOver) return;
    const playerClass = currentPlayer === 'X' ? 'turn-x' : 'turn-o';
    let label = currentPlayer;
    if (gameMode !== 'pvp' && currentPlayer === 'O') {
      label = 'IA';
    }
    statusBanner.innerHTML = `Turno de <span class="turn-indicator ${playerClass}">${label}</span>`;
  }

  // Limpiar y resetear el tablero para una nueva partida
  function resetBoard() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    isGameOver = false;
    isAiThinking = false;

    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
      cell.disabled = false;
    });

    renderTurnBanner();
  }

  // Ejecuta la jugada en la posición indicada
  function makeMove(index, player) {
    if (board[index] !== '' || isGameOver) return false;

    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase(), 'taken');

    playSound(player === 'X' ? 'move-x' : 'move-o');

    const winningCombo = checkWinner(board, player);
    if (winningCombo) {
      handleGameOver(player, winningCombo);
      return true;
    }

    if (isBoardFull(board)) {
      handleGameOver('tie');
      return true;
    }

    // Alternar jugador
    currentPlayer = player === 'X' ? 'O' : 'X';
    renderTurnBanner();

    // Si es el turno de la IA y la partida sigue activa
    if (gameMode !== 'pvp' && currentPlayer === 'O' && !isGameOver) {
      triggerAiMove();
    }

    return true;
  }

  function handleGameOver(result, combo = null) {
    isGameOver = true;

    if (result === 'tie') {
      scores.ties++;
      playSound('tie');
      updateStatusBanner('¡Empate entre ambos!');
    } else {
      scores[result.toLowerCase()]++;
      playSound('win');

      if (combo) {
        combo.forEach(idx => {
          cells[idx].classList.add('winner', result.toLowerCase());
        });
      }

      let winnerName = result;
      if (gameMode !== 'pvp') {
        winnerName = result === 'X' ? '¡Has ganado tu!' : '¡La IA ha ganado!';
        updateStatusBanner(winnerName);
      } else {
        const playerClass = result === 'X' ? 'turn-x' : 'turn-o';
        statusBanner.innerHTML = `¡Victoria para <span class="turn-indicator ${playerClass}">Jugador ${result}</span>!`;
      }
    }

    updateScoreUI();
    savePersistedData();
  }

  function triggerAiMove() {
    isAiThinking = true;
    // Pequeño retardo natural para simular pensamiento
    setTimeout(() => {
      if (isGameOver) {
        isAiThinking = false;
        return;
      }

      let targetIndex = -1;
      if (gameMode === 'ai-easy') {
        targetIndex = getEasyMove(board);
      } else if (gameMode === 'ai-hard') {
        targetIndex = getBestMove(board, 'O', 'X');
      }

      if (targetIndex !== -1) {
        makeMove(targetIndex, 'O');
      }

      isAiThinking = false;
    }, 380);
  }

  // Manejador del clic en celdas
  function handleCellClick(e) {
    if (isGameOver || isAiThinking) return;

    // En modos contra la IA, el usuario solo juega cuando es el turno de 'X'
    if (gameMode !== 'pvp' && currentPlayer !== 'X') return;

    const cell = e.currentTarget;
    const index = parseInt(cell.getAttribute('data-index'), 10);

    if (board[index] === '') {
      makeMove(index, currentPlayer);
    }
  }

  // Cambio de modo de juego
  function setGameMode(newMode) {
    gameMode = newMode;
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === newMode);
    });

    if (newMode === 'pvp') {
      labelOEl.textContent = 'Jugador O';
    } else if (newMode === 'ai-easy') {
      labelOEl.textContent = 'IA Fácil';
    } else {
      labelOEl.textContent = 'IA Imbatible';
    }

    playSound('click');
    resetBoard();
  }

  // Event Listeners
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      if (mode) setGameMode(mode);
    });
  });

  btnRestart.addEventListener('click', () => {
    playSound('click');
    resetBoard();
  });

  btnResetScores.addEventListener('click', () => {
    playSound('click');
    scores.x = 0;
    scores.o = 0;
    scores.ties = 0;
    updateScoreUI();
    savePersistedData();
  });

  btnToggleSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    updateSoundUI();
    savePersistedData();
    if (soundEnabled) {
      playSound('click');
    }
  });

  // Inicialización al cargar la página
  loadPersistedData();
  resetBoard();
}

// Exportación modular para pruebas unitarias con Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WINNING_COMBOS,
    checkWinner,
    isBoardFull,
    getEmptyIndices,
    getEasyMove,
    minimax,
    getBestMove
  };
}
