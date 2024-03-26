export const AuthHeader = 'authorization'
export const TimeZone = 'timezone'
export const verifyTokenHeader = 'verify-token'
export enum HTTPResponseCode {
    SUCCESS = 200,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    METHOD_NOT_ALLOWED = 405,
    INTERNAL_SERVER_ERROR = 500
}
