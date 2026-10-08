# 🎮 Tres en Raya (Tic-Tac-Toe) con Supabase

Un juego web moderno de **Tres en Raya** desarrollado con HTML5, CSS3, JavaScript vanilla y sincronizado con **Supabase (PostgreSQL)** para registrar el historial de partidas, rankings y clasificaciones globales.

---

## 📊 Información que se Puede Guardar en la Base de Datos

En un juego de Tres en Raya, los datos relevantes se dividen en tres entidades principales:

### 1. `players` (Perfiles y Estadísticas de Jugadores)
- **`id`** (`UUID`): Identificador único del jugador.
- **`nickname`** (`TEXT UNIQUE`): Apodo elegido por el usuario (ej. `Alex`, `GamerPro`).
- **`games_played`** (`INTEGER`): Partidas totales disputadas.
- **`wins`** (`INTEGER`): Total de victorias.
- **`losses`** (`INTEGER`): Total de derrotas.
- **`ties`** (`INTEGER`): Total de empates.
- **`created_at`** / **`last_played_at`** (`TIMESTAMPTZ`): Marcas de tiempo de actividad.

### 2. `matches` (Historial de Partidas)
- **`id`** (`UUID`): Identificador único de cada partida disputada.
- **`game_mode`** (`TEXT`): Modalidad jugada (`pvp`, `ai-easy`, `ai-hard`).
- **`player_x_name`** (`TEXT`): Apodo del jugador X.
- **`player_o_name`** (`TEXT`): Apodo del jugador O (o `IA Fácil` / `IA Imbatible`).
- **`winner`** (`TEXT`): Resultado de la partida (`X`, `O` o `tie`).
- **`total_moves`** (`INTEGER`): Número de casillas marcadas (entre 5 y 9).
- **`duration_seconds`** (`INTEGER`): Duración de la partida en segundos.
- **`final_board`** (`JSONB`): Matriz final del tablero (ej. `['X','O','X','','O','',...]`) para permitir visualizar o reproducir el desenlace.
- **`created_at`** (`TIMESTAMPTZ`): Fecha y hora exacta de la partida.

### 3. `match_moves` (Auditoría / Replay Jugada a Jugada)
- **`id`** (`BIGSERIAL`): Identificador del movimiento.
- **`match_id`** (`UUID`): Referencia a la partida.
- **`move_number`** (`INTEGER`): Turno del 1 al 9.
- **`player`** (`CHAR(1)`): Jugador que ejecutó la jugada (`X` o `O`).
- **`cell_index`** (`INTEGER`): Posición en el tablero (0 a 8).
- **`created_at`** (`TIMESTAMPTZ`): Instante del movimiento.

---

## ⚡ Cómo Conectar tu Proyecto de Supabase

El juego funciona de forma predeterminada en **Modo Local (Offline)** sin necesidad de configurar nada. Si deseas activar la sincronización en la nube:

### Paso 1: Crear Proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea un proyecto nuevo (gratuito).

### Paso 2: Ejecutar el Esquema SQL
1. En el panel lateral de Supabase, ve a **SQL Editor**.
2. Abre o copia el contenido del archivo [`supabase_schema.sql`](supabase_schema.sql).
3. Pégalo en el editor y haz clic en **Run**.
   - Esto creará automáticamente las tablas `players`, `matches`, `match_moves`, la vista `leaderboard`, las políticas de seguridad RLS y la función de guardado atómico.

### Paso 3: Conectar la Aplicación
1. En Supabase, ve a **Project Settings -> API**.
2. Copia tu **Project URL** y tu **Project API Keys (anon / public)**.
3. Abre el juego en tu navegador ([`index.html`](index.html)).
4. Haz clic en el botón superior **⚙️ Modo Local**.
5. Pega tu URL y tu Anon Key, y pulsa **Guardar y Probar**.
6. El indicador cambiará a **🟢 Supabase Conectado**.

*Alternativa:* También puedes renombrar el archivo `config.example.js` a `config.js` y declarar tus credenciales allí.

---

## 🌟 Características del Juego

- **Modos de Juego:**
  - 👥 **1 vs 1 Local:** Juega contra un amigo en el mismo equipo.
  - 🤖 **vs IA Fácil:** Movimientos aleatorios y relajados.
  - ⚡ **vs IA Imbatible:** Algoritmo **Minimax** óptimo (la IA nunca pierde).
- **Audio Nativo:** Sintetizador con Web Audio API (efectos para fichas, victorias, empates y clics).
- **Visualización de Clasificación (🏆 Ranking):** Top de jugadores con porcentaje de victorias desde Supabase.
- **Historial en Tiempo Real (📜 Historial):** Registro de las últimas partidas con rival, modo y ganador.
- **Respaldo Local:** Si no hay conexión o no has configurado Supabase, el juego almacena las victorias locales en `localStorage` sin errores.

---

## 🧪 Pruebas Automatizadas

Para validar las condiciones del juego y la invencibilidad del algoritmo Minimax:

```bash
node test_ai.js
```
