const otpGenerator = require('otp-generator')
import { Request } from 'express'
import { OtpType } from '../Constant/index'
import axios from 'axios'
export const generateOTP = (type: OtpType, len: number): string => {
    if (type === OtpType.ALPHANUMERIC) {
        return otpGenerator.generate(len, { alphabets: true, specialChars: false, digits: true, upperCase: true });
    } else if (type === OtpType.NUMERIC) {
        return otpGenerator.generate(len, { alphabets: false, specialChars: false, digits: true, upperCase: false });
    } else if (type === OtpType.ALPHANUMERICSPL) {
        return otpGenerator.generate(len, { alphabets: true, specialChars: true, digits: true, upperCase: true });
    } else throw new Error('invalid_otp_type')
}

export const getCommandLineVariable = (array: Array<any>, variable: string): string | boolean | number => {
    try {
        var indexOfVariable = array.indexOf(variable)
        return array[indexOfVariable + 1] ? array[indexOfVariable + 1] : false
    } catch (error: any) {
        return false
    }
}

export const getIp = (req: Request): string => {
    return Array(req.headers['x-forwarded-for']).join(' ') || req.connection.remoteAddress || req.ip;
}

export const userAgent = (req: Request): string => {
    if (req.useragent?.source)
        return req.useragent.source
    else return `${req?.useragent?.browser} ${req?.useragent?.browser} ${req?.useragent?.os} ${req?.useragent?.platform}`
}
export const timeNow = Date.now

export const generateUsernameFromMail = (email: string) => {
    let array = email.split('@');
    return array[0].replace(/[^\w]/gi, '')
}

export const getFullName = (firstName: string, lastName?: string | null): string => {
    return firstName + (lastName ? ' ' + lastName : '')
}

export const imageUrlToBase64 = async (url:string) => {
    try {
        let image = await axios.get(url, { responseType: 'arraybuffer' });
        let raw = Buffer.from(image.data).toString('base64');
        return "data:" + image.headers["content-type"] + ";base64," + raw;
    } catch (error: any) {
        throw error
    }
}