import 'dotenv/config';

export const DATABASE_URL: string = process.env.DATABASE_URL || '';
export const PORT: number = Number(process.env.PORT) || 4000;
export const MAIL_HOST: string = process.env.MAIL_HOST || '';
export const MAIL_PORT: number = Number(process.env.MAIL_PORT) || 2525;
export const MAIL_USER: string = process.env.MAIL_USER || '';
export const MAIL_PASS: string = process.env.MAIL_PASS || '';
