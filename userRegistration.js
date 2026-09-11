const bcrypt = require('bcryptjs');

const DEFAULT_AVATAR_URL = 'https://example.com/assets/default-avatar.png';
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
const DEFAULT_HASH_ROUNDS = 12;

function normalizeUsername(username) {
  return typeof username === 'string' ? username.trim() : '';
}

function toCanonicalUsername(username) {
  return normalizeUsername(username).toLowerCase();
}

function normalizeDisplayName(displayName) {
  return typeof displayName === 'string' ? displayName.trim() : '';
}

async function registerUser({ username, password, displayName }, existingUsers = []) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedDisplayName = normalizeDisplayName(displayName);

  if (!normalizedUsername) {
    throw new Error('ユーザー名は必須です。');
  }

  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    throw new Error('ユーザー名は英数字とアンダースコアのみ使用できます。');
  }

  if (!password || typeof password !== 'string') {
    throw new Error('パスワードは必須です。');
  }

  if (!normalizedDisplayName) {
    throw new Error('表示名は必須です。');
  }

  const canonicalUsername = toCanonicalUsername(normalizedUsername);
  const isDuplicate = existingUsers.some((user) => {
    const existingUsername = normalizeUsername(user.username);
    return toCanonicalUsername(existingUsername) === canonicalUsername;
  });

  if (isDuplicate) {
    throw new Error('そのユーザー名はすでに使用されています。');
  }

  const hashedPassword = await bcrypt.hash(password, DEFAULT_HASH_ROUNDS);

  const newUser = {
    username: canonicalUsername,
    displayName: normalizedDisplayName,
    hashedPassword,
    avatarUrl: DEFAULT_AVATAR_URL,
    bio: '',
    website: '',
    followersCount: 0,
    followingCount: 0,
    totalHeartsReceived: 0,
    postedCharts: [],
    likedCharts: [],
    createdAt: new Date().toISOString(),
  };

  return newUser;
}

module.exports = {
  DEFAULT_AVATAR_URL,
  USERNAME_PATTERN,
  toCanonicalUsername,
  registerUser,
};

if (require.main === module) {
  (async () => {
    let users = [];

    console.log('--- user registration demo start ---');

    const registeredUser = await registerUser(
      {
        username: 'Chart_Creator01',
        password: 'SuperSecurePass123!',
        displayName: '譜面師Axsis',
      },
      users
    );

    users = users.concat(registeredUser);

    const { hashedPassword, ...safeUserPreview } = registeredUser;

    console.log('登録結果:', safeUserPreview);
    console.log('ハッシュ照合:', await bcrypt.compare('SuperSecurePass123!', registeredUser.hashedPassword));
    console.log('保存件数:', users.length);
    console.log('--- user registration demo end ---');
  })().catch((error) => {
    console.error('Demo failed:', error);
    process.exitCode = 1;
  });
}
