import {
    Modal,
    IMLoginLogs
} from '../Model'
import { Session, Response, objectIdToString, Redis, dbConnect } from '../Library'
import { Response as ExpressResponse, NextFunction } from 'express'
import { LoginSessionToken, IRequestUser } from '../Type'
import { AuthHeader } from '../Constant/RequestResponse'
import { HTTPResponseCode } from '../Constant/RequestResponse'
import ErrorCode from '../Constant/error'
import { timeNow } from '../Util'
import { ActiveStatus, UserType } from '../Constant'
export const Auth = async (req: IRequestUser, res: ExpressResponse, next: NextFunction) => {
    const authToken = req.headers[AuthHeader]
    console.log('User - req', JSON.stringify({ url: req.originalUrl, payload: req.body, headers: req.headers, params: req.params }));
    await dbConnect()
    try {
        if (!authToken)
            return Response.send(res, HTTPResponseCode.UNAUTHORIZED, { error: ErrorCode.INVALID_AUTH_TOKEN })
        const getToken = await Redis.get({
            token: authToken
        }) as {
            id: string,
            ip: string,
            r: number,
            w: number,
            idle: number,
            ttl: number,
            d?: {
                roleId: string,
                userAgent: string,
                email: string,
                name: string,
                role: string,
                userType: UserType
            }
        }
        if (!getToken) {
            await Modal.MLoginLog.updateOne({
                token: authToken,
                loggedOut: {
                    $eq: null
                },
            }, {
                $set: {
                    loggedOut: timeNow()
                }
            })
            return Response.send(res, HTTPResponseCode.UNAUTHORIZED, { error: ErrorCode.INVALID_AUTH_TOKEN })
        }
        req.user = {
            id: getToken.id,
            ip: getToken.ip,
            userAgent: getToken?.d?.userAgent as string,
            userType: getToken?.d?.userType as UserType,
            roleId: getToken?.d?.roleId as string,
            username: getToken?.d?.name as string,
            email: getToken?.d?.email as string

        }
        next()
    } catch (error: any) {
        console.log(error)
        return Response.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, { error: ErrorCode.INTERNAL_SERVER_ERROR })
    }
}