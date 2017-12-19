const config = require('./config.json');

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

if (env === 'development' || env === 'test') {
  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });
}
