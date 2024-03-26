import { Request } from 'express'
import { UserType } from '../Constant'
import { Types } from 'mongoose'
export interface EmailConfig {
    host: string,
    email: string,
    password: string,
    port: number
}

export interface templateReplacer {
    replacement: string,
    replacer: string
}

export interface Permission {
    key: string,
    view: boolean,
    edit: boolean,
    add: boolean,
    delete: boolean
}

export interface LoginSessionToken {
    id: string,
    ip: string,
    userAgent: string,
    userType: UserType,
    roleId: string,
    username: string,
    email: string
}

export interface IRequestUser extends Request {
    user?: LoginSessionToken
}

export interface SessionParams {
    iv: string,
    content: string,
    expiresIn: number
}

export interface ResponseBody {
    data?: Object,
    error?: string,
    message?:string
}

export interface IPaginate {
    limit: number,
    page: number,
    sort?: {
        [key: string]: 1 | -1
    },
    filter?: {
        [key: string]: string | number | boolean
    }
    searchKey?: string,
    additionalPayload?: {
        [key: string ]: string | number | boolean | any
    },
    export?: boolean,
}