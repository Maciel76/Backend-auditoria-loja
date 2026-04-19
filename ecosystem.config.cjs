const dotenv = require('dotenv');
const path = require('path');

// Carrega o .env manualmente
const envConfig = dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  apps: [{
    name: 'backend-auditoria',
    script: 'server.js',
    cwd: __dirname,
    env: {
      ...envConfig.parsed,
      NODE_ENV: 'production'
    }
  }]
};
