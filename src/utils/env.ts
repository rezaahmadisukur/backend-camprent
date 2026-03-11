import 'dotenv/config';

export const DATABASE_URL: string = process.env.DATABASE_URL || '';
export const PORT: number = Number(process.env.PORT) || 4000;
export const EMAIL_USER: string = process.env.EMAIL_USER || '';
export const EMAIL_PASS: string = process.env.EMAIL_PASS || '';
