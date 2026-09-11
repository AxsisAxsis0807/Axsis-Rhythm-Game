const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const {
  DEFAULT_AVATAR_URL,
  registerUser,
  toCanonicalUsername,
} = require('./userRegistration');

(async () => {
  const existingUsers = [{ username: ' creator_zero ' }];

  const { user, users } = await registerUser(
    {
      username: '  Chart_Creator01  ',
      password: 'SuperSecurePass123!',
      displayName: '譜面師Axsis',
    },
    existingUsers
  );

  assert.equal(existingUsers.length, 1);
  assert.equal(users.length, 2);
  assert.equal(users[1].username, 'chart_creator01');
  assert.equal(user.username, 'chart_creator01');
  assert.equal(user.displayName, '譜面師Axsis');
  assert.equal(user.avatarUrl, DEFAULT_AVATAR_URL);
  assert.equal(user.bio, '');
  assert.equal(user.website, '');
  assert.equal(user.followersCount, 0);
  assert.equal(user.followingCount, 0);
  assert.equal(user.totalHeartsReceived, 0);
  assert.deepEqual(user.postedCharts, []);
  assert.deepEqual(user.likedCharts, []);
  assert.equal(await bcrypt.compare('SuperSecurePass123!', user.hashedPassword), true);
  assert.match(user.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.equal(toCanonicalUsername('  Mixed_Name  '), 'mixed_name');
  assert.equal(toCanonicalUsername('  Chart_Creator01  '), toCanonicalUsername('Chart_Creator01'));

  await assert.rejects(
    registerUser(
      {
        username: 'CREATOR_ZERO',
        password: 'AnotherPass123!',
        displayName: 'Duplicate',
      },
      existingUsers
    ),
    /すでに使用されています/
  );

  await assert.rejects(
    registerUser(
      {
        username: 'invalid-name!',
        password: 'ValidPass123!',
        displayName: 'Invalid Name',
      },
      existingUsers
    ),
    /英数字とアンダースコアのみ/
  );

  await assert.rejects(
    registerUser(
      {
        username: '   ',
        password: 'ValidPass123!',
        displayName: 'No Username',
      },
      existingUsers
    ),
    /ユーザー名は必須です/
  );

  await assert.rejects(
    registerUser(
      {
        username: 'valid_name',
        password: '',
        displayName: 'No Password',
      },
      existingUsers
    ),
    /パスワードは必須です/
  );

  await assert.rejects(
    registerUser(
      {
        username: 'valid_name',
        password: 'ValidPass123!',
        displayName: '   ',
      },
      existingUsers
    ),
    /表示名は必須です/
  );

  console.log('userRegistration.test.js: all tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
