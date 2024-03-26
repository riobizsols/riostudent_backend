"use strict";
import crypto from "crypto";
import getConfig from '../Config'
import { LoginSessionToken, SessionParams } from '../Type'
import {
    Modal,
    IMUser,
    IMLoginLogs
} from '../Model'
import { timeNow } from '../Util/index'
import moment from 'moment'
export const Session = class Session {
    static generateKey(secret: string) {
        return crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
    }
    static createSessionToken(payload: LoginSessionToken, secretKey: boolean | string = false, expires_in: boolean | number = false): SessionParams { // _id -> userID ->used for salt for the password
        try {
            const sessionPayload = JSON.stringify(payload) as string
            if (!secretKey) secretKey = getConfig('SECRET')
            secretKey = Session.generateKey(secretKey as string)
            const iv = crypto.randomBytes(16)
            const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
            const encrypted = Buffer.concat([cipher.update(sessionPayload), cipher.final()]);
            return {
                iv: iv.toString('hex'),
                content: encrypted.toString('hex'),
                expiresIn: expires_in ? expires_in : getConfig('SESSION_EXPIRES_ON')
            };
        } catch (error: any) {
            throw error
        }
    }
    static getDataFromToken(base64Hash: string, secretKey: boolean | string = false): LoginSessionToken {
        try {
            const hash = Session.stringToHash(base64Hash)
            if (!secretKey) secretKey = getConfig('SECRET')
            secretKey = Session.generateKey(secretKey as string)
            
            const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, Buffer.from(hash.iv, 'hex'));
            const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return JSON.parse(decrpyted.toString());
        } catch (error: any) {
            throw error
        }
    }

    static tokenIntoString(sessionParams: SessionParams) {
        return Buffer.from(`${sessionParams.iv}:${sessionParams.content}:${sessionParams.expiresIn}`).toString('base64')
    }

    static stringToHash(string: string) {
        let bufferHash = Buffer.from(string, 'base64').toString()
        let array = bufferHash.split(':')
        return {
            iv: array[0],
            content: array[1],
            expiresIn: array[2]
        }
    }

    static async autoIdleSessionExpire() {
        try {
            const date = moment().subtract(getConfig('SESSION_EXPIRES_ON'), 'seconds')
            await Modal.MLoginLog.updateMany({
                lastTransactionAt: {
                    $lte: date.toDate(),
                },
                loggedOut: { $eq: null }
            }, {
                $set: {
                    loggedOut: timeNow()
                }
            })
        } catch (error: any) {
            throw error
        }
    }
}