import { HTTPResponseCode } from '../Constant/RequestResponse'
import { Response as ExpressResponse } from 'express'
import { ResponseBody } from '../Type/index'
import ErrorCode from '../Constant/error'
export const Response = class Response {
    static send(res: ExpressResponse, responseCode: HTTPResponseCode, reponseData: ResponseBody) {
        try {
            return res.status(responseCode).send(reponseData).end()
        } catch (error: any) {
            return res.status(HTTPResponseCode.INTERNAL_SERVER_ERROR).send({ data: {}, error: ErrorCode.INTERNAL_SERVER_ERROR }).end()
        }
    }
}