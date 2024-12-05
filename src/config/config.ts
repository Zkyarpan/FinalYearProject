import dotenv from "dotenv";

dotenv.config();

const config = Object.freeze({
  port: Number(process.env.PORT) || 3000, 
  hostname: process.env.HOSTNAME || "localhost",
  databaseUrl: process.env.MONGO_URI || "",
  env: process.env.NODE_ENV || "development",
});

export default config;
