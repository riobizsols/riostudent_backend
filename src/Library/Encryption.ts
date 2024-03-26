import crypto from "crypto";
import getConfig from '../Config'
export const Encryption = class Encryption {
    static encrypt(text: string) {
        try {
            let iv = crypto.randomBytes(16);
            let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(getConfig('SECRET')), iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (error: any) {
            throw error;
        }
    }
    static decrypt(text: string) {
        try {
            let textParts: Array<any> = text.split(':');
            let iv = Buffer.from(textParts.shift(), 'hex');
            let encryptedText = Buffer.from(textParts.join(':'), 'hex');
            let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(getConfig('SECRET')), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error: any) {
            throw error;
        }
    }
}

// console.log(Encryption.encrypt('{"username":"sankar.c@infognana.com","password":"igadmin@1234"}'))