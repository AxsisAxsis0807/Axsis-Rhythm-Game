const bcrypt = require('bcryptjs');

const DEFAULT_AVATAR_URL = 'https://example.com/assets/default-avatar.png';
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
const DEFAULT_HASH_ROUNDS = 12;

function normalizeUsername(username) {
  return typeof username === 'string' ? username.trim() : '';
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

  const isDuplicate = existingUsers.some(
    (user) => normalizeUsername(user.username).toLowerCase() === normalizedUsername.toLowerCase()
  );

  if (isDuplicate) {
    throw new Error('そのユーザー名はすでに使用されています。');
  }

  const hashedPassword = await bcrypt.hash(password, DEFAULT_HASH_ROUNDS);

  const newUser = {
    username: normalizedUsername,
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

  existingUsers.push(newUser);
  return newUser;
}

module.exports = {
  DEFAULT_AVATAR_URL,
  USERNAME_PATTERN,
  registerUser,
};

if (require.main === module) {
  const assert = require("node:assert/strict");

  (async () => {
    const users = [];

    console.log('--- user registration demo start ---');

    const registeredUser = await registerUser(
      {
        username: 'Chart_Creator01',
        password: 'SuperSecurePass123!',
        displayName: '譜面師Axsis',
      },
      users
    );

    assert.equal(users.length, 1);
    assert.equal(registeredUser.username, 'Chart_Creator01');
    assert.equal(registeredUser.displayName, '譜面師Axsis');
    assert.equal(registeredUser.avatarUrl, DEFAULT_AVATAR_URL);
    assert.equal(registeredUser.followersCount, 0);
    assert.equal(registeredUser.followingCount, 0);
    assert.equal(registeredUser.totalHeartsReceived, 0);
    assert.deepEqual(registeredUser.postedCharts, []);
    assert.deepEqual(registeredUser.likedCharts, []);
    assert.notEqual(registeredUser.hashedPassword, 'SuperSecurePass123!');
    assert.equal(await bcrypt.compare('SuperSecurePass123!', registeredUser.hashedPassword), true);

    console.log('成功ケース: OK');

    await assert.rejects(
      registerUser(
        {
          username: 'Chart_Creator01',
          password: 'AnotherPass123!',
          displayName: 'Duplicate',
        },
        users
      ),
      /すでに使用されています/
    );

    console.log('重複ユーザー名チェック: OK');

    await assert.rejects(
      registerUser(
        {
          username: 'invalid-name!',
          password: 'ValidPass123!',
          displayName: 'Invalid Name',
        },
        users
      ),
      /英数字とアンダースコアのみ/
    );

    console.log('ユーザー名バリデーション: OK');
    console.log('--- all demo tests passed ---');
  })().catch((error) => {
    console.error('Demo failed:', error);
    process.exitCode = 1;
  });
}
