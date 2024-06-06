import { HttpException } from '../exceptions/HttpException';
import crypto from 'crypto';

export const convertToNum = (str: string, errorMessage: string) => {
    const num = parseInt(str);
    if (Number.isNaN(num) || num < 0) throw new HttpException(400, errorMessage);
    return num;
};

export const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const createIdFromEmail = (email: string) => {
    return crypto.createHash('sha256').update(email).digest('hex');
}

export const convertToNumOrNull = (value: string | undefined, errorMessage: string): number | null => {
    if (value === undefined || value === null) {
        return null;
    }
    const num = Number(value);
    if (isNaN(num)) {
        throw new Error(errorMessage);
    }
    return num;
};