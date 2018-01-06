function makeRandomString(length) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; i -= 1) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function makeTimestamp(time_from_now = 0) {
  const now = Math.floor(Date.now() / 1000);
  return now + time_from_now;
}

module.exports = { makeRandomString, makeTimestamp };
