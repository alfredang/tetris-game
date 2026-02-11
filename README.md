# Tetris Game

A modern, browser-based Tetris game with a stunning neon arcade theme.

**[Play Now](https://alfredang.github.io/tetris-game/)**

## How to Play

### Objective

Stack falling tetromino pieces to complete horizontal lines. When a line is completely filled, it clears and you earn points. The game ends when pieces stack up to the top of the board.

### Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move piece left/right |
| `↓` | Soft drop (faster fall) |
| `↑` | Rotate piece |
| `Space` | Hard drop (instant drop) |
| `P` | Pause/Resume |

### Mobile Controls

On mobile devices, touch controls appear at the bottom of the screen:
- **←** / **→** — Move left/right
- **↓** — Soft drop
- **↻** — Rotate
- **⬇** — Hard drop

## Game Mechanics

### Tetromino Pieces

There are 7 different pieces, each with a unique shape and color:

| Piece | Color |
|-------|-------|
| I | Cyan |
| O | Yellow |
| T | Purple |
| S | Green |
| Z | Red |
| J | Blue |
| L | Orange |

### Ghost Piece

A transparent "ghost" piece shows where your current piece will land, helping you plan your moves.

### Scoring

| Lines Cleared | Points |
|---------------|--------|
| 1 line | 100 × level |
| 2 lines | 300 × level |
| 3 lines | 500 × level |
| 4 lines (Tetris) | 800 × level |

### Leveling Up

- Level increases every 10 lines cleared
- Higher levels = faster drop speed
- Maximum speed is reached at higher levels for a real challenge

### High Score

Your high score is saved locally in your browser and persists between sessions.

## Features

- **Responsive Design** — Works on desktop, tablet, and mobile
- **Neon Arcade Theme** — Stunning dark theme with glowing effects
- **Sound Effects** — Audio feedback for moves, rotations, and line clears
- **Ghost Piece** — See where your piece will land
- **Wall Kicks** — Smart rotation system that adjusts piece position near walls
- **Next Piece Preview** — See the upcoming piece to plan ahead
- **Pause/Resume** — Take a break without losing progress

## Running Locally

Simply open `index.html` in any modern web browser:

```bash
# Clone the repository
git clone https://github.com/alfredang/tetris-game.git

# Open in browser
open tetris-game/index.html
```

No build steps or dependencies required!

### Docker

You can also run the game in a Docker container:

```bash
# Clone the repository
git clone https://github.com/alfredang/tetris-game.git
cd tetris-game

# Build the image
docker build -t tetris-game .

# Run the container
docker run -d -p 8080:80 tetris-game
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Browser Support

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

---

**Have fun and aim for that high score!**
