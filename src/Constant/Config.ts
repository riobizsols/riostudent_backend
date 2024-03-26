export enum Config {
    MONGO_URI = "mongodb+srv://bet:EkoRbSvzJEIHwCUA@bet-db.izpfgjd.mongodb.net/bet?retryWrites=true&w=majority",
    SECRET = '1ac89df654feea7d252ec4c492711075',
    SESSION_EXPIRES_ON = 3600, // 1 hour = 3600 seconds
    PORT = 8083,
    VERIFY_LINK_EXPIRES_ON = 1800, // 30 minutes = 1800 seconds
    OTP_EXPIRES_ON = 900, // 15 minutes = 900 seconds,
    REDIS_APP_NAME = 'bet_api',
    REDIS_PORT = 17757,
    REDIS_HOST = '',
    REDIS_PASSWORD = '',
    MONGO_CONNECTION_LIMIT = 1700,
    CORS_ALLOWED_DOMAINS = '*'
}
