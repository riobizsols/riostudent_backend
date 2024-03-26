export enum OtpType {
    NUMERIC = 'numeric',
    ALPHANUMERIC = 'alpha_numeric',
    ALPHANUMERICSPL = 'alpha_numeric_spl'
}

export enum UserType {
    ADMIN = 0,
    USER = 1
}

export enum ActiveStatus {
    active = 1,
    inactive = 0,
    delete = 2
}

export enum VerifyRequestType {
    LOGIN = 'login',
    FORGET_PASSWORD = 'forget_password',
    EMAIL_VERIFICATION = 'email_verification',
    MOBILE_VERIFICATION = 'mobile_verification',
    LOGIN_WITH_OTP = 'login_withotp',
    REGISTER_WITH_OTP = 'register_withotp'


}

export enum VerifyType {
    LINK = 'link',
    OTP = 'otp'
}


export const axiosDefaultHeader = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36'