import dotenv from 'dotenv';

dotenv.config();

const config = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  hostname: process.env.HOSTNAME || 'localhost',
  databaseUrl: process.env.MONGO_URI || '',
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.REFRESH_TOKEN,
  secretKey: process.env.CLIENT_SECRET_KEY || '',
  monogUri: process.env.MONGO_URI || '',
});

export default config;
