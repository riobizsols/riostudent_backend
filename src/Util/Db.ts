import { Types } from 'mongoose'
import getConfig from '../Config/index'
import { OtpType, UserType, VerifyRequestType, VerifyType } from '../Constant/index'
import { Modal } from '../Model'
import { Password, objectIdToString, stringToObjectId, Encryption } from '../Library'
import ErrorCode from '../Constant/error'
import { generateOTP, timeNow } from '.'
import moment from 'moment'


export const updatePassword = async (_id: string | Types.ObjectId, passwordText: string | undefined) => {
    try {
        if (!passwordText)
            throw new Error(ErrorCode.EMPTY_PASSWORD)
        let userId: string = objectIdToString(_id) as string
        let password = Password.generatePassword(passwordText, userId)
        return await Modal.MUser.updateOne({ _id }, {
            $set: {
                password: password,
                firstLogin: 1
            }
        })
    } catch (error: any) {
        throw error
    }
}

export const emailExist = async (email: string, _id: boolean | string | Types.ObjectId) => {
    const emailReg = new RegExp(`^${email.trim()}$`, 'i')
    if (_id) {
        const userId: Types.ObjectId = stringToObjectId(_id) as Types.ObjectId
        return await Modal.MUser.findOne({
            email: emailReg,
            _id: { $ne: userId }
        })
    } else
        return await Modal.MUser.findOne({
            email: emailReg
        })
}

export const mobileExist = async (mobile: string, _id: boolean | string | Types.ObjectId) => {
    const mobileReg = new RegExp(`^${mobile.trim()}$`, 'i')
    if (_id) {
        const userId: Types.ObjectId = stringToObjectId(_id) as Types.ObjectId
        return await Modal.MUser.findOne({
            mobile: mobileReg,
            _id: { $ne: userId }
        })
    } else
        return await Modal.MUser.findOne({
            username: mobileReg
        })
}




export const createOtp = async (requestType: VerifyRequestType, userId: Types.ObjectId | string | null): Promise<{
    otp: string,
    tokenString: string
}> => {
    try {
        const now = timeNow()
        const expiredOn = moment(now).add(getConfig('OTP_EXPIRES_ON'), 'seconds')
        const _id: string = objectIdToString(userId) as string
        const otp: string = generateOTP(OtpType.NUMERIC, 6)
        const tokenString: string = Encryption.encrypt(JSON.stringify({
            type: VerifyType.OTP,
            requestType,
            _id,
            time: now
        }))
        await Modal.MVerifyLog.create({
            userId: _id ? _id : null,
            type: VerifyType.OTP,
            requestType,
            data: {
                otp,
                tokenString
            },
            createdOn: now,
            expiredOn: expiredOn
        })
        return {
            otp,
            tokenString
        }
    } catch (error: any) {
        throw error
    }
}