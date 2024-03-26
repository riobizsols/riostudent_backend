import crypto from "crypto";
import passwordValidator from 'password-validator'
/** Min 8, Max: 15, Atleast one upper, lower, digits, symbols */
const schema = new passwordValidator()
    .is().min(8)
    .is().max(15)
    .has().uppercase(1)
    .has().lowercase(1)
    .has().digits(1)
    .has().symbols(1)
    .has().not().spaces()
export const Password = class Password {
    static generatePassword(password: string, _id: string, random: boolean = false) { // _id -> userID ->used for salt for the password
        try {
            if (random) password = Password.generateRandomPassword(8);
            return crypto.pbkdf2Sync(password, _id,
                1000, 64, `sha512`).toString(`hex`);
        } catch (error: any) {
            throw error;
        }
    }
    static checkPassword(passwordText: string, passwordHash: string, _id: string): boolean {
        try {
            return (
                (crypto.pbkdf2Sync(passwordText, _id,
                    1000, 64, `sha512`).toString(`hex`)) === passwordHash
            );
        } catch (error: any) {
            throw error;
        }
    }

    static validatePassword(passwordText: string): boolean {
        return schema.validate(passwordText) as boolean
    }
    static generateRandomPassword(len?: number) {
        try {
            var length = len ? len : 8;
            var string = "abcdefghijklmnopqrstuvwxyz"; //to upper
            var numeric = "0123456789";
            var punctuation = "!@#$%&*()_+~|}{[]:;?><,./-=";
            var password = "";
            var character = "";
            while (password.length < length) {
                let entity1 = Math.ceil(string.length * Math.random() * Math.random());
                let entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
                let entity3 = Math.ceil(
                    punctuation.length * Math.random() * Math.random()
                );
                let hold = string.charAt(entity1);
                hold = password.length % 2 == 0 ? hold.toUpperCase() : hold;
                character += hold;
                character += numeric.charAt(entity2);
                character += punctuation.charAt(entity3);
                password = character;
            }
            password = password
                .split("")
                .sort(function () {
                    return 0.5 - Math.random();
                })
                .join("");
            return password.substr(0, len);
        } catch (error: any) {
            throw error;
        }
    }
}