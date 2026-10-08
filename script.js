/**
 * Tres en Raya (Tic-Tac-Toe) - Lógica del Juego e Integración con Supabase
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
  const empty = getEmptyIndices(board);
  if (empty.length === 9) {
    return 4; // Centro estratégico
  }
  const result = minimax([...board], aiPlayer, 0, aiPlayer, humanPlayer);
  return result.index !== undefined ? result.index : empty[0];
}

// -------------------------------------------------------------
// LÓGICA DE INTERFAZ Y CLIENTE SUPABASE (NAVEGADOR)
// -------------------------------------------------------------

if (typeof window !== 'undefined') {
  // Estado local del juego
  let board = Array(9).fill('');
  let currentPlayer = 'X';
  let isGameOver = false;
  let isAiThinking = false;
  let gameMode = 'pvp'; // 'pvp' | 'ai-easy' | 'ai-hard'
  let soundEnabled = true;
  let matchStartTime = null;

  const scores = {
    x: 0,
    o: 0,
    ties: 0
  };

  // Instancia del cliente Supabase
  let supabaseClient = null;
  let isSupabaseConnected = false;

  // Referencias al DOM
  const cells = document.querySelectorAll('.cell');
  const statusBanner = document.getElementById('status-banner');
  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreTiesEl = document.getElementById('score-ties');
  const labelXEl = document.getElementById('label-x');
  const labelOEl = document.getElementById('label-o');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const btnRestart = document.getElementById('btn-restart');
  const btnResetScores = document.getElementById('btn-reset-scores');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const soundIconEl = document.getElementById('sound-icon');
  const playerNicknameInput = document.getElementById('player-nickname');

  // Elementos de Supabase y Modales
  const btnOpenDbConfig = document.getElementById('btn-open-db-config');
  const dbStatusDot = document.getElementById('db-status-dot');
  const dbStatusText = document.getElementById('db-status-text');

  const btnOpenLeaderboard = document.getElementById('btn-open-leaderboard');
  const btnOpenHistory = document.getElementById('btn-open-history');

  const modalDb = document.getElementById('modal-db');
  const modalLeaderboard = document.getElementById('modal-leaderboard');
  const modalHistory = document.getElementById('modal-history');

  const inputSupabaseUrl = document.getElementById('input-supabase-url');
  const inputSupabaseKey = document.getElementById('input-supabase-key');
  const dbFeedbackMsg = document.getElementById('db-feedback-msg');
  const btnSaveDbConfig = document.getElementById('btn-save-db-config');
  const btnClearDbConfig = document.getElementById('btn-clear-db-config');

  const leaderboardContent = document.getElementById('leaderboard-content');
  const btnRefreshLeaderboard = document.getElementById('btn-refresh-leaderboard');

  const historyContent = document.getElementById('history-content');
  const btnRefreshHistory = document.getElementById('btn-refresh-history');

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

  // ==================== GESTIÓN DE SUPABASE ====================

  function getSupabaseCredentials() {
    const localUrl = localStorage.getItem('supabase_url') || '';
    const localKey = localStorage.getItem('supabase_key') || '';
    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey };
    }
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
      return window.SUPABASE_CONFIG;
    }
    return null;
  }

  function initSupabase() {
    const creds = getSupabaseCredentials();
    if (creds && creds.url && creds.anonKey && window.supabase && window.supabase.createClient) {
      try {
        supabaseClient = window.supabase.createClient(creds.url, creds.anonKey);
        inputSupabaseUrl.value = creds.url;
        inputSupabaseKey.value = creds.anonKey;
        testSupabaseConnection(false);
      } catch (err) {
        console.warn('Error inicializando Supabase:', err);
        setSupabaseStatus(false);
      }
    } else {
      setSupabaseStatus(false);
    }
  }

  function setSupabaseStatus(connected) {
    isSupabaseConnected = connected;
    if (connected) {
      btnOpenDbConfig.classList.add('connected');
      dbStatusText.textContent = 'Supabase Conectado';
    } else {
      btnOpenDbConfig.classList.remove('connected');
      dbStatusText.textContent = 'Modo Local';
    }
  }

  async function testSupabaseConnection(showAlert = true) {
    if (!supabaseClient) {
      setSupabaseStatus(false);
      if (showAlert) showDbFeedback('Ingresa la URL y Anon Key válidas de Supabase.', 'error');
      return false;
    }

    try {
      if (showAlert) showDbFeedback('Probando conexión...', '');
      // Intenta leer 1 registro de matches o players
      const { error } = await supabaseClient.from('matches').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSupabaseStatus(true);
      if (showAlert) showDbFeedback('¡Conexión establecida exitosamente con Supabase!', 'success');
      return true;
    } catch (err) {
      console.warn('Fallo de conexión con Supabase:', err);
      setSupabaseStatus(false);
      if (showAlert) {
        showDbFeedback(`Error de conexión: ${err.message || 'Verifica la URL, Key o el schema SQL.'}`, 'error');
      }
      return false;
    }
  }

  function showDbFeedback(msg, type) {
    dbFeedbackMsg.textContent = msg;
    dbFeedbackMsg.className = `feedback-msg show ${type}`;
  }

  // Guardar partida en Supabase
  async function recordMatchInSupabase(result, totalMoves, finalBoard, durationSecs) {
    if (!supabaseClient || !isSupabaseConnected) return;

    const playerX = (playerNicknameInput.value.trim()) || 'Jugador X';
    let playerO = 'Jugador O';
    if (gameMode === 'ai-easy') playerO = 'IA Fácil';
    else if (gameMode === 'ai-hard') playerO = 'IA Imbatible';

    const payload = {
      p_game_mode: gameMode,
      p_player_x: playerX,
      p_player_o: playerO,
      p_winner: result,
      p_total_moves: totalMoves,
      p_duration_seconds: durationSecs,
      p_final_board: finalBoard
    };

    try {
      // 1. Intentar registrar a través de la función atómica RPC
      const { error: rpcError } = await supabaseClient.rpc('record_game_result', payload);
      if (!rpcError) return;

      // 2. Si la función RPC no existe, insertar directamente en la tabla matches
      console.info('RPC no disponible, insertando directamente en tabla matches...');
      await supabaseClient.from('matches').insert([{
        game_mode: gameMode,
        player_x_name: playerX,
        player_o_name: playerO,
        winner: result,
        total_moves: totalMoves,
        duration_seconds: durationSecs,
        final_board: finalBoard
      }]);
    } catch (err) {
      console.warn('No se pudo guardar la partida en Supabase:', err);
    }
  }

  // Consultar Clasificación (Leaderboard)
  async function loadLeaderboard() {
    leaderboardContent.innerHTML = '<div class="loading-state">Cargando clasificación...</div>';

    if (!supabaseClient || !isSupabaseConnected) {
      leaderboardContent.innerHTML = `
        <div class="empty-state">
          <p>⚠️ Modo Local activo.</p>
          <p style="margin-top:6px;font-size:0.8rem;">Conecta tu base de datos de Supabase desde el botón de configuración (⚙️) para ver el ranking global.</p>
        </div>
      `;
      return;
    }

    try {
      // Intentar vista leaderboard o tabla players
      let query = supabaseClient.from('leaderboard').select('*').limit(15);
      let { data, error } = await query;

      if (error) {
        // Fallback directo a players
        const fallback = await supabaseClient
          .from('players')
          .select('nickname, games_played, wins, losses, ties')
          .order('wins', { ascending: false })
          .limit(15);
        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

      if (!data || data.length === 0) {
        leaderboardContent.innerHTML = '<div class="empty-state">Aún no hay jugadores registrados. ¡Sé el primero en jugar!</div>';
        return;
      }

      let html = `
        <table class="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Partidas</th>
              <th>Victorias</th>
              <th>% Éxito</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.forEach((p, index) => {
        const rankClass = index === 0 ? 'rank-top1' : (index === 1 ? 'rank-top2' : (index === 2 ? 'rank-top3' : ''));
        const winPct = p.win_rate_percentage !== undefined 
          ? p.win_rate_percentage 
          : (p.games_played > 0 ? ((p.wins / p.games_played) * 100).toFixed(1) : 0);

        html += `
          <tr>
            <td class="${rankClass}">${index + 1}</td>
            <td><strong>${escapeHtml(p.nickname)}</strong></td>
            <td>${p.games_played}</td>
            <td><span class="badge-win">${p.wins}</span></td>
            <td>${winPct}%</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      leaderboardContent.innerHTML = html;
    } catch (err) {
      leaderboardContent.innerHTML = `<div class="empty-state">Error cargando clasificación: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Consultar Historial de Partidas
  async function loadMatchHistory() {
    historyContent.innerHTML = '<div class="loading-state">Cargando partidas...</div>';

    if (!supabaseClient || !isSupabaseConnected) {
      historyContent.innerHTML = `
        <div class="empty-state">
          <p>⚠️ Modo Local activo.</p>
          <p style="margin-top:6px;font-size:0.8rem;">Conecta tu base de datos de Supabase desde el botón (⚙️) para registrar y revisar el historial de partidas.</p>
        </div>
      `;
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        historyContent.innerHTML = '<div class="empty-state">Aún no hay partidas registradas en la base de datos.</div>';
        return;
      }

      let html = `
        <table class="custom-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Modo</th>
              <th>Partida</th>
              <th>Ganador</th>
              <th>Jugadas</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.forEach(m => {
        const dateStr = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        let resultBadge = '';
        if (m.winner === 'tie') {
          resultBadge = '<span class="badge-tie">Empate</span>';
        } else if (m.winner === 'X') {
          resultBadge = `<span class="badge-win">${escapeHtml(m.player_x_name)} (X)</span>`;
        } else {
          resultBadge = `<span class="badge-loss">${escapeHtml(m.player_o_name)} (O)</span>`;
        }

        const modeLabel = m.game_mode === 'pvp' ? '1 vs 1' : (m.game_mode === 'ai-easy' ? 'vs Fácil' : 'vs Imbatible');

        html += `
          <tr>
            <td>${dateStr}</td>
            <td>${modeLabel}</td>
            <td>${escapeHtml(m.player_x_name)} <em>vs</em> ${escapeHtml(m.player_o_name)}</td>
            <td>${resultBadge}</td>
            <td>${m.total_moves} movs</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      historyContent.innerHTML = html;
    } catch (err) {
      historyContent.innerHTML = `<div class="empty-state">Error cargando historial: ${escapeHtml(err.message)}</div>`;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ==================== MODALES ====================
  function openModal(modalEl) {
    modalEl.classList.add('open');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('open');
  }

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      const targetModal = document.getElementById(targetId);
      if (targetModal) closeModal(targetModal);
    });
  });

  [modalDb, modalLeaderboard, modalHistory].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [modalDb, modalLeaderboard, modalHistory].forEach(closeModal);
    }
  });

  btnOpenDbConfig.addEventListener('click', () => {
    dbFeedbackMsg.className = 'feedback-msg';
    openModal(modalDb);
  });

  btnOpenLeaderboard.addEventListener('click', () => {
    openModal(modalLeaderboard);
    loadLeaderboard();
  });

  btnOpenHistory.addEventListener('click', () => {
    openModal(modalHistory);
    loadMatchHistory();
  });

  btnRefreshLeaderboard.addEventListener('click', loadLeaderboard);
  btnRefreshHistory.addEventListener('click', loadMatchHistory);

  btnSaveDbConfig.addEventListener('click', async () => {
    const url = inputSupabaseUrl.value.trim();
    const key = inputSupabaseKey.value.trim();

    if (!url || !key) {
      showDbFeedback('Por favor introduce la URL y Anon Key.', 'error');
      return;
    }

    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);

    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(url, key);
      await testSupabaseConnection(true);
    }
  });

  btnClearDbConfig.addEventListener('click', () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    inputSupabaseUrl.value = '';
    inputSupabaseKey.value = '';
    supabaseClient = null;
    setSupabaseStatus(false);
    showDbFeedback('Configuración eliminada. Estás en Modo Local.', 'success');
  });

  // ==================== LÓGICA DEL JUEGO ====================

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
      const savedNickname = localStorage.getItem('player_nickname');
      if (savedNickname) {
        playerNicknameInput.value = savedNickname;
        labelXEl.textContent = savedNickname;
      }
    } catch {
      // Usar valores por defecto
    }
    updateScoreUI();
    updateSoundUI();
  }

  function savePersistedData() {
    try {
      localStorage.setItem('tictactoe_scores', JSON.stringify(scores));
      localStorage.setItem('tictactoe_sound', soundEnabled.toString());
      if (playerNicknameInput.value.trim()) {
        localStorage.setItem('player_nickname', playerNicknameInput.value.trim());
      }
    } catch {
      // Ignorar fallos de almacenamiento
    }
  }

  playerNicknameInput.addEventListener('input', () => {
    const nick = playerNicknameInput.value.trim() || 'Jugador X';
    labelXEl.textContent = nick;
    savePersistedData();
  });

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
    if (currentPlayer === 'X') {
      label = playerNicknameInput.value.trim() || 'X';
    } else if (gameMode !== 'pvp') {
      label = 'IA';
    }
    statusBanner.innerHTML = `Turno de <span class="turn-indicator ${playerClass}">${escapeHtml(label)}</span>`;
  }

  function resetBoard() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    isGameOver = false;
    isAiThinking = false;
    matchStartTime = null;

    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
      cell.disabled = false;
    });

    renderTurnBanner();
  }

  function makeMove(index, player) {
    if (board[index] !== '' || isGameOver) return false;

    if (!matchStartTime) {
      matchStartTime = Date.now();
    }

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

    // Alternar turno
    currentPlayer = player === 'X' ? 'O' : 'X';
    renderTurnBanner();

    // Turno IA
    if (gameMode !== 'pvp' && currentPlayer === 'O' && !isGameOver) {
      triggerAiMove();
    }

    return true;
  }

  function handleGameOver(result, combo = null) {
    isGameOver = true;
    const totalMoves = board.filter(c => c !== '').length;
    const durationSecs = matchStartTime ? Math.max(1, Math.round((Date.now() - matchStartTime) / 1000)) : 0;

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

      if (gameMode !== 'pvp') {
        const nick = playerNicknameInput.value.trim() || 'Jugador X';
        const msg = result === 'X' ? `¡Victoria para ${nick}!` : '¡La IA ha ganado!';
        updateStatusBanner(msg);
      } else {
        const playerClass = result === 'X' ? 'turn-x' : 'turn-o';
        const name = result === 'X' ? (playerNicknameInput.value.trim() || 'Jugador X') : 'Jugador O';
        statusBanner.innerHTML = `¡Victoria para <span class="turn-indicator ${playerClass}">${escapeHtml(name)}</span>!`;
      }
    }

    updateScoreUI();
    savePersistedData();

    // Sincronizar partida con Supabase en segundo plano
    recordMatchInSupabase(result, totalMoves, [...board], durationSecs);
  }

  function triggerAiMove() {
    isAiThinking = true;
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

  function handleCellClick(e) {
    if (isGameOver || isAiThinking) return;
    if (gameMode !== 'pvp' && currentPlayer !== 'X') return;

    const cell = e.currentTarget;
    const index = parseInt(cell.getAttribute('data-index'), 10);

    if (board[index] === '') {
      makeMove(index, currentPlayer);
    }
  }

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

  // Event Listeners principales
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

  // Inicialización de la aplicación
  loadPersistedData();
  initSupabase();
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
