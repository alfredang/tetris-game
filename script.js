// ============================================
// MODERN TETRIS GAME - Complete Implementation
// ============================================

// ============================================
// TETROMINO CLASS - Piece Definitions & Logic
// ============================================
class Tetromino {
    static SHAPES = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: '#00f0ff' // Cyan
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#ffea00' // Yellow
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#b026ff' // Purple
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: '#39ff14' // Green
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff0055' // Red
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#0066ff' // Blue
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff6600' // Orange
        }
    };

    constructor(type) {
        this.type = type;
        this.shape = JSON.parse(JSON.stringify(Tetromino.SHAPES[type].shape));
        this.color = Tetromino.SHAPES[type].color;
        this.x = Math.floor((10 - this.shape[0].length) / 2);
        this.y = 0;
    }

    rotate() {
        const newShape = this.shape[0].map((_, i) =>
            this.shape.map(row => row[i]).reverse()
        );
        return newShape;
    }

    static getRandomType() {
        const types = Object.keys(Tetromino.SHAPES);
        return types[Math.floor(Math.random() * types.length)];
    }
}

// ============================================
// BOARD CLASS - Grid Management & Collision
// ============================================
class Board {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array(this.height).fill(null).map(() => Array(this.width).fill(0));
    }

    isValidMove(piece, x, y, shape = piece.shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    // Check boundaries
                    if (newX < 0 || newX >= this.width || newY >= this.height) {
                        return false;
                    }
                    
                    // Check collision with locked pieces (skip if above board)
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece(piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const y = piece.y + row;
                    const x = piece.x + col;
                    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                        this.grid[y][x] = piece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        const linesToClear = [];

        // Find full lines
        for (let row = this.height - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
                linesCleared++;
            }
        }

        // Remove full lines and add empty ones at top
        linesToClear.forEach(row => {
            this.grid.splice(row, 1);
            this.grid.unshift(Array(this.width).fill(0));
        });

        return { linesCleared, linesToClear };
    }

    reset() {
        this.grid = this.createEmptyGrid();
    }

    getGhostPosition (piece) {
        let ghostY = piece.y;
        while (this.isValidMove(piece, piece.x, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }
}

// ============================================
// GAME CLASS - Main Game Controller
// ============================================
class Game {
    constructor() {
        this.board = new Board();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.running = false;
        
        this.dropInterval = 1000; // Initial drop speed (ms)
        this.lastDropTime = 0;
        this.fastDrop = false;
        
        // Load high score
        this.highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;
        
        // Audio settings
        this.muted = localStorage.getItem('tetrisMuted') === 'true';
        
        this.setupAudio();
    }

    setupAudio() {
        // Create a single audio context to reuse for all sounds
        this.audioContext = null;

        this.sounds = {
            move: this.createBeep(200, 0.05),
            rotate: this.createBeep(300, 0.05),
            drop: this.createBeep(150, 0.1),
            line: this.createBeep(400, 0.2),
            tetris: this.createBeep(600, 0.3),
            gameOver: this.createBeep(100, 0.5)
        };
    }

    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (browsers require user interaction)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    createBeep(frequency, duration) {
        return () => {
            if (this.muted) return;

            const audioContext = this.getAudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }

    start() {
        this.board.reset();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.running = true;
        this.paused = false;
        
        this.currentPiece = new Tetromino(Tetromino.getRandomType());
        this.nextPiece = new Tetromino(Tetromino.getRandomType());
        
        this.dropInterval = 1000;
        this.lastDropTime = Date.now();
    }

    pause() {
        this.paused = !this.paused;
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('tetrisMuted', this.muted);
    }

    moveLeft() {
        if (this.canMove(-1, 0)) {
            this.currentPiece.x--;
            this.sounds.move();
            return true;
        }
        return false;
    }

    moveRight() {
        if (this.canMove(1, 0)) {
            this.currentPiece.x++;
            this.sounds.move();
            return true;
        }
        return false;
    }

    moveDown() {
        if (this.canMove(0, 1)) {
            this.currentPiece.y++;
            this.lastDropTime = Date.now();
            return true;
        }
        return false;
    }

    canMove(dx, dy) {
        return this.board.isValidMove(
            this.currentPiece,
            this.currentPiece.x + dx,
            this.currentPiece.y + dy
        );
    }

    rotate() {
        const rotatedShape = this.currentPiece.rotate();
        
        // Try normal rotation
        if (this.board.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y, rotatedShape)) {
            this.currentPiece.shape = rotatedShape;
            this.sounds.rotate();
            return;
        }
        
        // Wall kick system - try offsets
        const kicks = [
            [1, 0], [-1, 0], [2, 0], [-2, 0],
            [0, -1], [1, -1], [-1, -1]
        ];
        
        for (const [dx, dy] of kicks) {
            if (this.board.isValidMove(this.currentPiece, this.currentPiece.x + dx, this.currentPiece.y + dy, rotatedShape)) {
                this.currentPiece.x += dx;
                this.currentPiece.y += dy;
                this.currentPiece.shape = rotatedShape;
                this.sounds.rotate();
                return;
            }
        }
    }

    hardDrop() {
        while (this.moveDown()) {
            // Keep dropping until it can't move down
        }
        this.lockPiece();
        this.sounds.drop();
    }

    lockPiece() {
        this.board.lockPiece(this.currentPiece);
        
        // Clear lines
        const { linesCleared } = this.board.clearLines();
        
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
            
            if (linesCleared === 4) {
                this.sounds.tetris();
            } else {
                this.sounds.line();
            }
        }
        
        // Spawn next piece
        this.currentPiece = this.nextPiece;
        this.nextPiece = new Tetromino(Tetromino.getRandomType());
        
        // Check game over
        if (!this.board.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver = true;
            this.running = false;
            this.sounds.gameOver();
            
            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('tetrisHighScore', this.highScore);
            }
        }
    }

    updateScore(linesCleared) {
        // Scoring system
        const points = [0, 100, 300, 500, 800];
        this.score += points[linesCleared] * this.level;
        this.lines += linesCleared;
        
        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
        }
    }

    update() {
        if (!this.running || this.paused || this.gameOver) return;

        // Auto drop
        const currentTime = Date.now();
        const dropSpeed = this.fastDrop ? 50 : this.dropInterval;

        if (currentTime - this.lastDropTime > dropSpeed) {
            if (!this.moveDown()) {
                this.lockPiece();
            }
            this.lastDropTime = currentTime;
        }
    }
}

// ============================================
// RENDERER CLASS - Canvas Drawing
// ============================================
class Renderer {
    constructor(canvas, nextCanvas, blockSize = 30) {
        this.canvas = canvas;
        this.nextCanvas = nextCanvas;
        this.ctx = canvas.getContext('2d');
        this.nextCtx = nextCanvas.getContext('2d');
        this.blockSize = blockSize;
        
        this.setupCanvas();
    }

    setupCanvas() {
        // Main canvas
        this.canvas.width = 10 * this.blockSize;
        this.canvas.height = 20 * this.blockSize;
        
        // Next piece canvas
        this.nextCanvas.width = 6 * this.blockSize;
        this.nextCanvas.height = 6 * this.blockSize;
    }

    drawBlock(ctx, x, y, color, glow = false) {
        const padding = 2;
        ctx.fillStyle = color;
        ctx.fillRect(
            x * this.blockSize + padding,
            y * this.blockSize + padding,
            this.blockSize - padding * 2,
            this.blockSize - padding * 2
        );
        
        if (glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.fillRect(
                x * this.blockSize + padding,
                y * this.blockSize + padding,
                this.blockSize - padding * 2,
                this.blockSize - padding * 2
            );
            ctx.shadowBlur = 0;
        }
        
        // Highlight
        const gradient = ctx.createLinearGradient(
            x * this.blockSize,
            y * this.blockSize,
            x * this.blockSize + this.blockSize,
            y * this.blockSize + this.blockSize
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            x * this.blockSize + padding,
            y * this.blockSize + padding,
            this.blockSize - padding * 2,
            this.blockSize - padding * 2
        );
    }

    drawBoard(board) {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw locked pieces
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x]) {
                    this.drawBlock(this.ctx, x, y, board.grid[y][x]);
                }
            }
        }
    }

    drawGhostPiece(game) {
        const ghostY = game.board.getGhostPosition(game.currentPiece);
        const piece = game.currentPiece;
        
        this.ctx.globalAlpha = 0.2;
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    this.drawBlock(this.ctx, piece.x + col, ghostY + row, piece.color);
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawCurrentPiece(piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    if (y >= 0) {
                        this.drawBlock(this.ctx, x, y, piece.color, true);
                    }
                }
            }
        }
    }

    drawNextPiece(piece) {
        // Clear canvas
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // Center the piece
        const offsetX = Math.floor((6 - piece.shape[0].length) / 2);
        const offsetY = Math.floor((6 - piece.shape.length) / 2);
        
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    this.drawBlock(
                        this.nextCtx,
                        offsetX + col,
                        offsetY + row,
                        piece.color,
                        true
                    );
                }
            }
        }
    }

    render(game) {
        this.drawBoard(game.board);
        
        if (game.currentPiece && !game.gameOver) {
            this.drawGhostPiece(game);
            this.drawCurrentPiece(game.currentPiece);
        }
        
        if (game.nextPiece) {
            this.drawNextPiece(game.nextPiece);
        }
    }
}

// ============================================
// GAME CONTROLLER - Initialize & Run
// ============================================
class GameController {
    constructor() {
        this.game = new Game();
        
        // Get canvas elements
        const canvas = document.getElementById('gameCanvas');
        const nextCanvas = document.getElementById('nextPieceCanvas');
        
        // Determine block size based on screen size
        const blockSize = window.innerWidth < 480 ? 16 : (window.innerWidth < 768 ? 20 : 30);
        this.renderer = new Renderer(canvas, nextCanvas, blockSize);
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.highScoreElement = document.getElementById('highScore');
        this.overlayElement = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.muteBtn = document.getElementById('muteBtn');
        
        this.setupControls();
        this.updateUI();
        this.animate();
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.game.running || this.game.gameOver) return;
            
            if (this.game.paused && e.key !== 'p' && e.key !== 'P') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.game.moveLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.game.moveRight();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.game.fastDrop = true;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.game.rotate();
                    break;
                case ' ':
                    e.preventDefault();
                    this.game.hardDrop();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowDown') {
                this.game.fastDrop = false;
            }
        });
        
        // Button controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        
        // Mobile touch controls
        document.getElementById('leftBtn')?.addEventListener('click', () => this.game.moveLeft());
        document.getElementById('rightBtn')?.addEventListener('click', () => this.game.moveRight());
        document.getElementById('downBtn')?.addEventListener('click', () => {
            this.game.fastDrop = true;
            setTimeout(() => this.game.fastDrop = false, 100);
        });
        document.getElementById('rotateBtn')?.addEventListener('click', () => this.game.rotate());
        document.getElementById('dropBtn')?.addEventListener('click', () => this.game.hardDrop());
    }

    startGame() {
        this.game.start();
        this.overlayElement.classList.add('hidden');
        this.pauseBtn.disabled = false;
        this.restartBtn.disabled = false;
        this.updateUI();
    }

    togglePause() {
        if (!this.game.running) return;
        
        this.game.pause();
        
        if (this.game.paused) {
            this.overlayTitle.textContent = 'PAUSED';
            this.overlayMessage.textContent = 'Press P or click Resume to continue';
            this.startBtn.textContent = 'Resume';
            this.overlayElement.classList.remove('hidden');
            this.pauseBtn.textContent = 'Resume';
        } else {
            this.overlayElement.classList.add('hidden');
            this.pauseBtn.textContent = 'Pause';
        }
    }

    restartGame() {
        this.startGame();
    }

    toggleMute() {
        this.game.toggleMute();
        const icon = this.muteBtn.querySelector('.icon');
        icon.textContent = this.game.muted ? '🔇' : '🔊';
    }

    updateUI() {
        this.scoreElement.textContent = this.game.score;
        this.levelElement.textContent = this.game.level;
        this.linesElement.textContent = this.game.lines;
        this.highScoreElement.textContent = this.game.highScore;
        
        if (this.game.gameOver) {
            this.overlayTitle.textContent = 'GAME OVER';
            this.overlayMessage.textContent = `Score: ${this.game.score}`;
            this.startBtn.textContent = 'Play Again';
            this.overlayElement.classList.remove('hidden');
            this.pauseBtn.disabled = true;
        }
    }

    animate() {
        this.game.update();
        this.renderer.render(this.game);
        this.updateUI();
        
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// INITIALIZE GAME
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    new GameController();
});
