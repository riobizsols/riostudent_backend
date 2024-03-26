import getConfig from '../Config/index'
import ErrorCode from '../Constant/error'
const RedisSession = require('redis-sessions') // https://www.npmjs.com/package/redis-sessions
var RedisSessionInstance: any = null

export const Redis = class Redis {
    static initiateInstance() {
        try {
            if (!RedisSessionInstance) {
                RedisSessionInstance = new RedisSession({
                    host: getConfig('REDIS_HOST'),
                    port: getConfig('REDIS_PORT'),
                    options: {
                        password: getConfig('REDIS_PASSWORD')
                    }
                });
                return RedisSessionInstance
            } else return RedisSessionInstance
        } catch (error: any) {
            console.log(error, 'error')
            throw error
        }
    }

    static getRedisApp() {
        return getConfig('REDIS_APP_NAME')
    }

    static create(payload: { // create a session with user id
        userId: string,
        ip: string,
        additionalInfo: Object,
        redisApp?: string,
        ttl?: number
    }) {
        const {
            userId,
            ip,
            additionalInfo,
            redisApp,
            ttl
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().create({
                app: redisApp || Redis.getRedisApp(),
                id: userId,
                ip: ip,
                ttl: Number(getConfig('SESSION_EXPIRES_ON')),
                d: additionalInfo
            }, function (err: any, resp: {
                token: string
            }) {
                if (err) {
                    reject(err)
                }
                resolve(resp.token)
            })
        })
    }

    static get(payload: { // get a session
        token: string,
        redisApp?: string
    }) {
        const {
            token,
            redisApp
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().get({
                app: redisApp || Redis.getRedisApp(),
                token: token
            }, function (err: any, resp: any) {
                if (err)
                    resolve(false)
                if (Object.keys(resp).length > 0) {
                    resolve(resp)
                } else resolve(false)

            })
        })
    }

    static update(payload: { // update session additional payload
        token: string,
        redisApp?: string,
        updatePayload: Object
    }) {
        const {
            token,
            redisApp,
            updatePayload
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().set({
                app: redisApp || Redis.getRedisApp(),
                token: token,
                d: updatePayload
            }, function (err: any, resp: any) {
                if (err)
                    reject(err)
                resolve(resp)
            })
        })
    }

    static kill(payload: { // kill individual session with session token
        token: string,
        redisApp?: string,
    }) {
        const {
            token,
            redisApp,
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().kill({
                app: redisApp || Redis.getRedisApp(),
                token: token
            }, function (err: any, resp: any) {
                if (err)
                    reject(err)
                resolve(resp)
            })
        })
    }

    static sessionsOfApp(payload: { // get all sessions within app by time interval
        dt: number,
        redisApp?: string,
    }) {
        const {
            dt,
            redisApp,
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().soapp({
                app: redisApp || Redis.getRedisApp(),
                dt: dt
            }, function (err: any, resp: any) {
                if (err)
                    reject(err)
                resolve(resp)
            })
        })
    }

    static sessionsOfId(payload: { // get all sessions by user id
        id: string,
        redisApp?: string,
    }) {
        const {
            id,
            redisApp,
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().soid({
                id: id,
                app: redisApp || Redis.getRedisApp()
            }, function (err: any, resp: any) {
                if (err)
                    reject(err)
                resolve(resp)
            })
        })
    }

    static killAllSessionsOfId(payload: { // kill all sessions by user id
        id: string,
        redisApp?: string,
    }) {
        const {
            id,
            redisApp,
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().killsoid({
                id: id,
                app: redisApp || Redis.getRedisApp()
            }, function (err: any, resp: any) {
                if (err)
                    reject(err)
                resolve(resp)
            })
        })
    }

    static killallsessions(payload: { // kill all sessions by app
        redisApp?: string,
    }) {
        const {
            redisApp
        } = payload
        return new Promise((resolve, reject) => {
            Redis.initiateInstance().killall({
                app: redisApp || Redis.getRedisApp()
            }, function (err: any, resp: any) {
                if (err)
                    reject(err)
                resolve(resp)
            })
        })
    }
}
