# 🎮 Tres en Raya (Tic-Tac-Toe)

Un juego moderno, interactivo y responsivo de **Tres en Raya** desarrollado con HTML5, CSS3 y JavaScript vanilla.

---

## 🌟 Características

- **Modos de Juego:**
  - 👥 **1 vs 1 Local:** Dos jugadores compitiendo por turnos en el mismo dispositivo.
  - 🤖 **vs IA Fácil:** Partidas casuales con movimientos aleatorios.
  - ⚡ **vs IA Imbatible:** Impulsado por el algoritmo **Minimax**, garantizando que la IA nunca pierde (gana o empata).
- **Interfaz y Experiencia:**
  - Estilo moderno *Dark Glassmorphism* con efectos de brillo neon cian y magenta.
  - Efectos visuales de victoria con pulso en la línea ganadora.
  - Efectos de sonido dinámicos sintetizados en tiempo real mediante la **Web Audio API** (sin dependencias ni descargas externas).
  - Marcador de puntuación para Jugador X, Jugador O y Empates, con persistencia en `localStorage`.
  - Botón para silenciar o activar sonido.
  - Botón de reinicio rápido de partida y de reseteo de marcador.
  - Diseño 100% responsivo para móviles y ordenadores.

---

## 🚀 Cómo Jugar

### Opción 1: Directo en el Navegador
Haz doble clic sobre el archivo `index.html` o ábrelo directamente en tu navegador web preferido (Chrome, Edge, Firefox, Safari).

### Opción 2: Con Servidor Local
Si prefieres servirlo mediante un servidor local:

**Con Python:**
```bash
python -m http.server 8000
```
Luego abre `http://localhost:8000` en tu navegador.

**Con Node.js:**
```bash
npx serve .
```

---

## 🧪 Pruebas Automatizadas

Puedes ejecutar las pruebas unitarias y de simulación del algoritmo Minimax ejecutando:

```bash
node test_ai.js
```

El script simula 200 partidas automáticas contra el algoritmo Minimax para verificar que la tasa de derrotas de la IA sea exactamente 0.
