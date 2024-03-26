'use strict'
import { config as envConfig } from 'dotenv'
envConfig()
import express, { NextFunction } from 'express';
import { Request, Response } from 'express';
import bodyParser from "body-parser";
import { checkMongoServerStatus, dbConnect, mongoConnect } from './Library/Db'
import getConfig, { isProduction } from './Config'
import { Server, Socket } from "socket.io";
import { Server as httpServer } from 'http'
import { SocketListeners } from './Library'
import Service from './Service/index'
import UserAgent from 'express-useragent'
import { Response as HTTPResponse } from './Library'
import { HTTPResponseCode } from './Constant/RequestResponse'
import ErrorCode from './Constant/error'
import path from 'path'
export const init = (workerId: any) => {
    // server
    const app = express();
    const http = new httpServer(app)
    const port = getConfig('PORT')

    // socket server
    const io: Server = new Server(http)
    io.on("connection", SocketListeners)

    // express configuration
    app.use(bodyParser.json({ limit: "500mb" }));
    app.use(
        bodyParser.urlencoded({
            extended: true,
        })
    );
    app.use(UserAgent.express());
    app.use(function (req: any, res: any, next: any) {
        var allowedDomains = getConfig('CORS_ALLOWED_DOMAINS')
        var origin = req.headers.origin;
        res.setHeader('Access-Control-Allow-Headers', '*');
        if (allowedDomains == '*' || origin == undefined) {
            res.setHeader('Access-Control-Allow-Origin', '*');
        } else {
            allowedDomains = String(allowedDomains).split(',')
            if (allowedDomains.indexOf(origin) > -1) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            }
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, UPDATE');
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('Cache-control', 'no-cache, no-store, must-revalidate');
        next();
    })

    app.use('/api/v1/', Service())
    app.use('/static', express.static(path.join(__dirname, '../public')))
    app.use('/api/v1/export', express.static(path.join(__dirname, '../public/temp')))

    app.get('/', (req: Request, res: Response) => {
        return res.send(checkMongoServerStatus());
    })

    app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
        return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, { error: ErrorCode.INTERNAL_SERVER_ERROR })
    })

    app.disable('x-powered-by');


    http.listen(port, async () => {
        await mongoConnect()
        console.log(`The application is listening on port ${port} - ${workerId}!`);
    })
    return app
}
