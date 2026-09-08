const songs = [
    { title: 'Neon Sunrise', artist: 'Axsis', difficulty: '4K · ★ 3.5', color: '#667eea' },
    { title: 'Midnight Circuit', artist: 'Axsis', difficulty: '4K · ★ 5.0', color: '#ef6c9b' },
    { title: 'Crystal Pulse', artist: 'Axsis', difficulty: '4K · ★ 7.2', color: '#20b8aa' },
    { title: 'Digital Horizon', artist: 'Axsis', difficulty: '4K · ★ 9.1', color: '#f0a34b' },
];

const screens = {
    menu: document.getElementById('mainMenu'),
    select: document.getElementById('songSelectScreen'),
    game: document.getElementById('gameScreen'),
};
const songList = document.getElementById('songList');
const pressedKeys = new Set();
const keyElements = new Map([...document.querySelectorAll('.key[data-key]')].map((element) => [element.dataset.key, element]));
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const lanes = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
let notes = [];
let score = 0;
let combo = 0;
let gameStartedAt = 0;
let animationFrame;
let selectedSong = 0;

function showScreen(name) {
    Object.entries(screens).forEach(([screenName, element]) => {
        element.hidden = screenName !== name;
    });
    if (name !== 'game') {
        pressedKeys.clear();
        updateKeyDisplay();
        cancelAnimationFrame(animationFrame);
    } else {
        startGame();
    }
}

function selectSong(index) {
    selectedSong = (index + songs.length) % songs.length;
    const song = songs[selectedSong];
    [...songList.children].forEach((item, itemIndex) => item.classList.toggle('selected', itemIndex === selectedSong));
    document.getElementById('songTitle').textContent = song.title;
    document.getElementById('songArtist').textContent = song.artist;
    document.getElementById('songDifficulty').textContent = song.difficulty;
    document.getElementById('albumArt').style.background = `linear-gradient(135deg, ${song.color}, #17172b)`;
}

function renderSongs() {
    document.getElementById('songCount').textContent = songs.length;
    songList.replaceChildren(...songs.map((song, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'song-item';
        item.innerHTML = `<span class="song-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${song.title}</strong><small>${song.artist}</small></span><span class="song-stars">${song.difficulty.split('★ ')[1]}</span>`;
        item.addEventListener('click', () => selectSong(index));
        return item;
    }));
    selectSong(0);
}

function updateKeyDisplay() {
    keyElements.forEach((element, code) => element.classList.toggle('active', pressedKeys.has(code)));
}

function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = bounds.width * scale;
    canvas.height = bounds.height * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
}

function startGame() {
    resizeCanvas();
    notes = Array.from({ length: 32 }, (_, index) => ({
        lane: index % lanes.length,
        time: index * 700 + 1500,
        hit: false,
    }));
    score = 0;
    combo = 0;
    gameStartedAt = performance.now();
    updateScore();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(renderGame);
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = combo;
}

function renderGame(now) {
    const elapsed = now - gameStartedAt;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const laneWidth = width / lanes.length;
    const judgeY = height - 80;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#101020';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(102, 126, 234, .35)';
    lanes.forEach((_, lane) => {
        context.beginPath();
        context.moveTo(lane * laneWidth, 0);
        context.lineTo(lane * laneWidth, height);
        context.stroke();
    });
    notes.forEach((note) => {
        if (note.hit) return;
        const distance = note.time - elapsed;
        if (distance < -500) return;
        const y = judgeY - (distance / 1500) * (judgeY + 50);
        context.fillStyle = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'][note.lane];
        context.fillRect(note.lane * laneWidth + 8, y - 12, laneWidth - 16, 24);
    });
    animationFrame = requestAnimationFrame(renderGame);
}

function hitNote(code) {
    const elapsed = performance.now() - gameStartedAt;
    const note = notes.find((candidate) => !candidate.hit
        && lanes[candidate.lane] === code
        && Math.abs(candidate.time - elapsed) <= 180);
    if (!note) {
        combo = 0;
        updateScore();
        return;
    }
    note.hit = true;
    combo += 1;
    score += 100 * combo;
    updateScore();
}

document.getElementById('startButton').addEventListener('click', () => showScreen('select'));
document.getElementById('backButton').addEventListener('click', () => showScreen('menu'));
document.getElementById('gameBackButton').addEventListener('click', () => showScreen('select'));
document.getElementById('playButton').addEventListener('click', () => showScreen('game'));

document.addEventListener('keydown', (event) => {
    if (screens.select.hidden && !keyElements.has(event.code)) return;
    if (keyElements.has(event.code)) {
        event.preventDefault();
        pressedKeys.add(event.code);
        if (!screens.game.hidden && !event.repeat) hitNote(event.code);
        updateKeyDisplay();
    } else if (!screens.select.hidden && event.key === 'ArrowDown') {
        event.preventDefault();
        selectSong(selectedSong + 1);
    } else if (!screens.select.hidden && event.key === 'ArrowUp') {
        event.preventDefault();
        selectSong(selectedSong - 1);
    } else if (!screens.select.hidden && event.key === 'Enter') {
        document.getElementById('playButton').click();
    }
});
document.addEventListener('keyup', (event) => {
    if (keyElements.has(event.code)) {
        event.preventDefault();
        pressedKeys.delete(event.code);
        updateKeyDisplay();
    }
});
window.addEventListener('blur', () => {
    pressedKeys.clear();
    updateKeyDisplay();
});
window.addEventListener('resize', resizeCanvas);

renderSongs();
