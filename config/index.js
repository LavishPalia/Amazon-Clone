import dotenv from 'dotenv'

dotenv.config();

const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: process.env.JWT_SECRET || "30d",
}

export default config;