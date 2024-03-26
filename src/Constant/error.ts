enum ErrorCode {
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    MISMATCH_OLD_PASSWORD = 'MISMATCH_OLD_PASSWORD',
    PASSWORDS_SHOULD_BE_DIFFERENT = 'PASSWORDS_SHOULD_BE_DIFFERENT',
    INVALID_OTP_TYPE = 'INVALID_OTP_TYPE',
    INVALID_AUTH_TOKEN = 'INVALID_AUTH_TOKEN',
    UNAUTHORIZED = 'UNAUTHORIZED',
    DEACTIVATED_USER = 'DEACTIVATED_USER',
    BAD_REQUEST = 'BAD_REQUEST',
    EMAIL_EXISTS = 'EMAIL_EXISTS',
    USERNAME_EXISTS = 'USERNAME_EXISTS',
    EMPTY_PASSWORD = 'EMPTY_PASSWORD',
    INVALID_OTP = 'INVALID_OTP',
    VERIFY_TOKEN_EXPIRED = 'VERIFY_TOKEN_EXPIRED',
    PASSWORD_VALIDATION_FAILED = 'PASSWORD_VALIDATION_FAILED',
    NO_SUPER_ADMIN_USERS_FOUND = 'NO_SUPER_ADMIN_USERS_FOUND',
    EMAIL_NOT_VALID = 'EMAIL_NOT_VALID',
    VERIFY_TOKEN_NOT_VALID = 'VERIFY_TOKEN_NOT_VALID',
    EMAIL_OR_PHONE_NUMBER_NOT_VALID = 'EMAIL_OR_PHONE_NUMBER_NOT_VALID',
    EMAIL_ALREADY_SUBSCRIBED='EMAIL_ALREADY_SUBSCRIBED',
    PRODUCT_ALREADY_NOTIFIED='PRODUCT_ALREADY_NOTIFIED',
    OTP_FOR_EMAIL_OR_PHONE_NUMBER_NOT_VALID = 'OTP_FOR_EMAIL_OR_PHONE_NUMBER_NOT_VALID',
    THIS_USER_HAS_BEEN_DELETED= 'THIS_USER_HAS_BEEN_DELETED',
    MOBILE_NUMBER_ALREADY_EXIST='MOBILE_NUMBER_ALREADY_EXIST'



}

export default ErrorCode