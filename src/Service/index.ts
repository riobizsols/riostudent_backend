import express from 'express';
import UserService from '../Service/User';


export default function (): express.Router {
    const router = express.Router();
    router.use('/user', UserService())
    return router;
}

