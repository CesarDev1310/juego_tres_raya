-- ====================================================================
-- SUPABASE SCHEMA: TRES EN RAYA (TIC-TAC-TOE)
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase.
-- Crea las tablas de jugadores, historial de partidas, movimientos,
-- políticas de seguridad (RLS) y función atómica para registrar resultados.
-- ====================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: PLAYERS (Jugadores y Ranking)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL UNIQUE,
    games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
    wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
    ties INTEGER NOT NULL DEFAULT 0 CHECK (ties >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: MATCHES (Historial de Partidas)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_mode TEXT NOT NULL CHECK (game_mode IN ('pvp', 'ai-easy', 'ai-hard')),
    player_x_name TEXT NOT NULL,
    player_o_name TEXT NOT NULL,
    winner TEXT NOT NULL CHECK (winner IN ('X', 'O', 'tie')),
    total_moves INTEGER NOT NULL CHECK (total_moves BETWEEN 5 AND 9),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    final_board JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: MATCH_MOVES (Auditoría / Replay de Movimientos - Opcional)
CREATE TABLE IF NOT EXISTS public.match_moves (
    id BIGSERIAL PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL CHECK (move_number BETWEEN 1 AND 9),
    player CHAR(1) NOT NULL CHECK (player IN ('X', 'O')),
    cell_index INTEGER NOT NULL CHECK (cell_index BETWEEN 0 AND 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_game_mode ON public.matches (game_mode);
CREATE INDEX IF NOT EXISTS idx_players_wins ON public.players (wins DESC, games_played ASC);
CREATE INDEX IF NOT EXISTS idx_players_nickname ON public.players (nickname);
CREATE INDEX IF NOT EXISTS idx_match_moves_match_id ON public.match_moves (match_id, move_number ASC);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_moves ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS PARA ACCESO ANÓNIMO (anon key)
-- Permitir lectura pública a cualquiera
CREATE POLICY "Permitir lectura publica de jugadores"
    ON public.players FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Permitir insertar jugadores anonimamente"
    ON public.players FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir actualizar estadisticas de jugadores"
    ON public.players FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de partidas"
    ON public.matches FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Permitir insertar partidas anonimamente"
    ON public.matches FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de movimientos"
    ON public.match_moves FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Permitir insertar movimientos anonimamente"
    ON public.match_moves FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 8. VISTA DE CLASIFICACIÓN (LEADERBOARD)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
    nickname,
    games_played,
    wins,
    losses,
    ties,
    CASE 
        WHEN games_played > 0 THEN ROUND((wins::numeric / games_played::numeric) * 100, 1)
        ELSE 0 
    END AS win_rate_percentage,
    last_played_at
FROM public.players
ORDER BY wins DESC, games_played ASC;

-- 9. FUNCIÓN ALMACENADA ATÓMICA: Registrar Partida y Actualizar Jugador
CREATE OR REPLACE FUNCTION public.record_game_result(
    p_game_mode TEXT,
    p_player_x TEXT,
    p_player_o TEXT,
    p_winner TEXT,
    p_total_moves INTEGER,
    p_duration_seconds INTEGER,
    p_final_board JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match_id UUID;
    v_x_is_win BOOLEAN := (p_winner = 'X');
    v_x_is_loss BOOLEAN := (p_winner = 'O');
    v_x_is_tie BOOLEAN := (p_winner = 'tie');
BEGIN
    -- 1. Insertar la partida en la tabla matches
    INSERT INTO public.matches (
        game_mode,
        player_x_name,
        player_o_name,
        winner,
        total_moves,
        duration_seconds,
        final_board
    ) VALUES (
        p_game_mode,
        p_player_x,
        p_player_o,
        p_winner,
        p_total_moves,
        p_duration_seconds,
        p_final_board
    )
    RETURNING id INTO v_match_id;

    -- 2. Actualizar o insertar el jugador X (si tiene un apodo válido y no es vacío)
    IF p_player_x IS NOT NULL AND trim(p_player_x) <> '' THEN
        INSERT INTO public.players (
            nickname,
            games_played,
            wins,
            losses,
            ties,
            last_played_at
        ) VALUES (
            trim(p_player_x),
            1,
            CASE WHEN v_x_is_win THEN 1 ELSE 0 END,
            CASE WHEN v_x_is_loss THEN 1 ELSE 0 END,
            CASE WHEN v_x_is_tie THEN 1 ELSE 0 END,
            now()
        )
        ON CONFLICT (nickname) DO UPDATE SET
            games_played = public.players.games_played + 1,
            wins = public.players.wins + CASE WHEN v_x_is_win THEN 1 ELSE 0 END,
            losses = public.players.losses + CASE WHEN v_x_is_loss THEN 1 ELSE 0 END,
            ties = public.players.ties + CASE WHEN v_x_is_tie THEN 1 ELSE 0 END,
            last_played_at = now();
    END IF;

    -- 3. Si es modo PVP y el jugador O es otro humano distinto
    IF p_game_mode = 'pvp' AND p_player_o IS NOT NULL AND trim(p_player_o) <> '' AND trim(p_player_o) <> trim(p_player_x) THEN
        INSERT INTO public.players (
            nickname,
            games_played,
            wins,
            losses,
            ties,
            last_played_at
        ) VALUES (
            trim(p_player_o),
            1,
            CASE WHEN p_winner = 'O' THEN 1 ELSE 0 END,
            CASE WHEN p_winner = 'X' THEN 1 ELSE 0 END,
            CASE WHEN v_x_is_tie THEN 1 ELSE 0 END,
            now()
        )
        ON CONFLICT (nickname) DO UPDATE SET
            games_played = public.players.games_played + 1,
            wins = public.players.wins + CASE WHEN p_winner = 'O' THEN 1 ELSE 0 END,
            losses = public.players.losses + CASE WHEN p_winner = 'X' THEN 1 ELSE 0 END,
            ties = public.players.ties + CASE WHEN v_x_is_tie THEN 1 ELSE 0 END,
            last_played_at = now();
    END IF;

    RETURN v_match_id;
END;
$$;
