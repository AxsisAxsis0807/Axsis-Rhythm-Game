const updateViewportSize = () => {
  document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`);
  document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
};

const lockLandscape = async () => {
  if (!screen.orientation?.lock) {
    return;
  }

  try {
    await screen.orientation.lock('landscape');
  } catch (error) {
    // Some browsers only allow orientation lock in fullscreen or installed mode.
  }
};

const screens = [...document.querySelectorAll('.screen')];
const screenButtons = [...document.querySelectorAll('[data-screen-target]')];
const songCards = [...document.querySelectorAll('.mania-song-card')];
const currentSongLabel = document.querySelector('#currentSongLabel');
const gameStatusLabel = document.querySelector('#gameStatusLabel');
const scoreValue = document.querySelector('#scoreValue');
const comboValue = document.querySelector('#comboValue');
const judgeValue = document.querySelector('#judgeValue');
const canvas = document.querySelector('#gameCanvas');
const context = canvas?.getContext('2d');

const laneKeys = ['d', 'f', 'j', 'k'];
const laneColors = ['#ff7c98', '#67dbff', '#ffe272', '#8affc6'];
const laneBackgrounds = ['rgba(255, 124, 152, 0.12)', 'rgba(103, 219, 255, 0.12)', 'rgba(255, 226, 114, 0.12)', 'rgba(138, 255, 198, 0.12)'];
const lanePressed = [false, false, false, false];
const chartPattern = [0, 1, 2, 3, 1, 2, 0, 3, 2, 1, 3, 0];

let selectedSongTitle = document.querySelector('.mania-song-card.active')?.dataset.songTitle ?? 'Iyowa';
let judgeResetTimer = 0;

const gameState = {
  animationFrameId: 0,
  running: false,
  lastFrameTime: 0,
  spawnTimer: 0,
  spawnIndex: 0,
  notes: [],
  score: 0,
  combo: 0
};

const showScreen = (targetId) => {
  const nextScreen = screens.find((screenElement) => screenElement.id === targetId);

  if (!nextScreen) {
    return;
  }

  if (targetId === 'gameScreen') {
    currentSongLabel.textContent = selectedSongTitle;
    startGame();
  } else if (gameState.running) {
    stopGame();
  }

  screens.forEach((screenElement) => {
    const isTarget = screenElement.id === targetId;
    screenElement.hidden = !isTarget;
    screenElement.classList.toggle('is-active', isTarget);
  });
};

const setSelectedSong = (songCard) => {
  selectedSongTitle = songCard.dataset.songTitle ?? songCard.textContent.trim();

  songCards.forEach((card) => {
    const isActive = card === songCard;
    card.classList.toggle('active', isActive);
    card.setAttribute('aria-pressed', String(isActive));
  });
};

const updateHud = () => {
  scoreValue.textContent = String(gameState.score);
  comboValue.textContent = String(gameState.combo);
};

const setJudge = (label) => {
  judgeValue.textContent = label;
  clearTimeout(judgeResetTimer);
  judgeResetTimer = window.setTimeout(() => {
    if (gameState.running) {
      judgeValue.textContent = 'Ready';
    }
  }, 420);
};

const resetGame = () => {
  gameState.lastFrameTime = 0;
  gameState.spawnTimer = 0;
  gameState.spawnIndex = 0;
  gameState.notes = [];
  gameState.score = 0;
  gameState.combo = 0;
  updateHud();
  judgeValue.textContent = 'Ready';
};

const startGame = () => {
  if (!context) {
    gameStatusLabel.textContent = 'Canvas unavailable';
    return;
  }

  stopGame();
  resetGame();
  gameState.running = true;
  gameStatusLabel.textContent = 'Playing';
  drawGame();
  gameState.animationFrameId = window.requestAnimationFrame(stepGame);
};

const stopGame = () => {
  gameState.running = false;
  if (gameState.animationFrameId) {
    window.cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = 0;
  }
  gameState.notes = [];
  drawGame();
  gameStatusLabel.textContent = 'Standby';
};

const spawnNote = () => {
  const lane = chartPattern[gameState.spawnIndex % chartPattern.length];
  const tempoModifier = selectedSongTitle.length % laneKeys.length;

  gameState.notes.push({
    lane: (lane + tempoModifier) % laneKeys.length,
    y: -32,
    height: 22
  });

  gameState.spawnIndex += 1;
};

const registerMiss = () => {
  gameState.combo = 0;
  updateHud();
  setJudge('MISS');
};

const judgeLane = (laneIndex) => {
  if (!gameState.running) {
    return;
  }

  const judgeLineY = canvas.height - 96;
  const candidates = gameState.notes
    .filter((note) => note.lane === laneIndex)
    .sort((left, right) => Math.abs(left.y - judgeLineY) - Math.abs(right.y - judgeLineY));

  const targetNote = candidates[0];
  if (!targetNote) {
    registerMiss();
    return;
  }

  const distance = Math.abs(targetNote.y - judgeLineY);
  if (distance <= 26) {
    gameState.score += 1000;
    gameState.combo += 1;
    setJudge('PERFECT');
  } else if (distance <= 58) {
    gameState.score += 500;
    gameState.combo += 1;
    setJudge('GOOD');
  } else {
    registerMiss();
    return;
  }

  gameState.notes = gameState.notes.filter((note) => note !== targetNote);
  updateHud();
};

const updateNotes = (deltaTime) => {
  const judgeLineY = canvas.height - 96;
  const nextNotes = [];

  for (const note of gameState.notes) {
    const nextY = note.y + deltaTime * 0.3;

    if (nextY > judgeLineY + 72) {
      registerMiss();
      continue;
    }

    nextNotes.push({
      ...note,
      y: nextY
    });
  }

  gameState.notes = nextNotes;
};

const drawRoundedRect = (x, y, width, height, radius, fillStyle, strokeStyle = null) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();

  if (strokeStyle) {
    context.strokeStyle = strokeStyle;
    context.lineWidth = 2;
    context.stroke();
  }
};

const drawGame = () => {
  if (!context) {
    return;
  }

  const { width, height } = canvas;
  const laneWidth = width / laneKeys.length;
  const judgeLineY = height - 96;

  context.clearRect(0, 0, width, height);

  const backdrop = context.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, '#0f1628');
  backdrop.addColorStop(1, '#060913');
  context.fillStyle = backdrop;
  context.fillRect(0, 0, width, height);

  context.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let laneIndex = 0; laneIndex < laneKeys.length; laneIndex += 1) {
    const laneX = laneIndex * laneWidth;
    drawRoundedRect(
      laneX + 6,
      16,
      laneWidth - 12,
      height - 32,
      18,
      lanePressed[laneIndex] ? 'rgba(255, 255, 255, 0.12)' : laneBackgrounds[laneIndex],
      'rgba(255, 255, 255, 0.08)'
    );
  }

  context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  context.lineWidth = 1;
  for (let laneIndex = 1; laneIndex < laneKeys.length; laneIndex += 1) {
    const laneX = laneIndex * laneWidth;
    context.beginPath();
    context.moveTo(laneX, 24);
    context.lineTo(laneX, height - 24);
    context.stroke();
  }

  for (const note of gameState.notes) {
    const laneX = note.lane * laneWidth + 12;
    const noteWidth = laneWidth - 24;
    const gradient = context.createLinearGradient(laneX, note.y, laneX + noteWidth, note.y + note.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, laneColors[note.lane]);
    drawRoundedRect(laneX, note.y, noteWidth, note.height, 12, gradient);
  }

  const judgeGradient = context.createLinearGradient(24, judgeLineY, width - 24, judgeLineY);
  judgeGradient.addColorStop(0, '#8fb1d9');
  judgeGradient.addColorStop(1, '#c99ab0');
  context.fillStyle = judgeGradient;
  context.fillRect(24, judgeLineY, width - 48, 5);

  context.font = '700 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  laneKeys.forEach((laneKey, laneIndex) => {
    const keyY = height - 48;
    const centerX = laneWidth * laneIndex + laneWidth / 2;
    context.fillStyle = lanePressed[laneIndex] ? laneColors[laneIndex] : '#f4f7fb';
    context.fillText(laneKey.toUpperCase(), centerX, keyY);
  });

  context.textAlign = 'left';
  context.font = '600 18px Arial';
  context.fillStyle = 'rgba(255, 255, 255, 0.82)';
  context.fillText(selectedSongTitle, 20, 36);
};

const stepGame = (timestamp) => {
  if (!gameState.running) {
    return;
  }

  if (!gameState.lastFrameTime) {
    gameState.lastFrameTime = timestamp;
  }

  const deltaTime = Math.min(timestamp - gameState.lastFrameTime, 32);
  gameState.lastFrameTime = timestamp;
  gameState.spawnTimer += deltaTime;

  const spawnInterval = 480;
  while (gameState.spawnTimer >= spawnInterval) {
    spawnNote();
    gameState.spawnTimer -= spawnInterval;
  }

  updateNotes(deltaTime);
  drawGame();
  gameState.animationFrameId = window.requestAnimationFrame(stepGame);
};

songCards.forEach((songCard) => {
  songCard.addEventListener('click', () => {
    setSelectedSong(songCard);
  });
});

screenButtons.forEach((button) => {
  button.addEventListener('click', () => {
    lockLandscape();
    showScreen(button.dataset.screenTarget);
  });
});

window.addEventListener('keydown', (event) => {
  const laneIndex = laneKeys.indexOf(event.key.toLowerCase());
  if (laneIndex === -1 || event.repeat) {
    return;
  }

  lanePressed[laneIndex] = true;
  judgeLane(laneIndex);
  drawGame();
});

window.addEventListener('keyup', (event) => {
  const laneIndex = laneKeys.indexOf(event.key.toLowerCase());
  if (laneIndex === -1) {
    return;
  }

  lanePressed[laneIndex] = false;
  drawGame();
});

updateViewportSize();
lockLandscape();
drawGame();

window.addEventListener('resize', () => {
  updateViewportSize();
  drawGame();
});
window.addEventListener('orientationchange', updateViewportSize);
