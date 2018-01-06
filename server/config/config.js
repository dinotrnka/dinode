const config = require('./config.json');

const env = process.env.NODE_ENV || 'development';
const env_config = config[env];

if (env === 'development' || env === 'test') {
  Object.keys(env_config).forEach((key) => {
    process.env[key] = env_config[key];
  });
}
