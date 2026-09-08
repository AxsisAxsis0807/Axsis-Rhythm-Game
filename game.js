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
let selectedSong = 0;

function showScreen(name) {
    Object.entries(screens).forEach(([screenName, element]) => {
        element.hidden = screenName !== name;
    });
    if (name !== 'game') {
        pressedKeys.clear();
        updateKeyDisplay();
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

document.getElementById('startButton').addEventListener('click', () => showScreen('select'));
document.getElementById('backButton').addEventListener('click', () => showScreen('menu'));
document.getElementById('gameBackButton').addEventListener('click', () => showScreen('select'));
document.getElementById('playButton').addEventListener('click', () => showScreen('game'));

document.addEventListener('keydown', (event) => {
    if (screens.select.hidden && !keyElements.has(event.code)) return;
    if (keyElements.has(event.code)) {
        event.preventDefault();
        pressedKeys.add(event.code);
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

renderSongs();
