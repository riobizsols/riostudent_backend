import express, { Response, Request } from "express";
import { Modal, IMUser, IMVerifyLog } from "../Model";
import {
  Password,
  Session,
  Response as HTTPResponse,
  objectIdToString,
  Encryption,
  Redis,
  stringToObjectId,
  dbConnect,
} from "../Library";
import getConfig from "../Config";
import {
  getFullName,
  getIp,
  timeNow,
  userAgent as getUserAgent,
} from "../Util/index";
import {
  AuthHeader,
  HTTPResponseCode,
  verifyTokenHeader,
} from "../Constant/RequestResponse";
import ErrorCode from "../Constant/error";
import {
  ActiveStatus,
  axiosDefaultHeader,
  UserType,
  VerifyRequestType,
  VerifyType,
} from "../Constant";
import moment from "moment";
import { updatePassword, createOtp, emailExist, mobileExist } from "../Util/Db";
import { Auth } from "../Middleware";
import { Types } from "mongoose";
import { IPaginate, IRequestUser } from "../Type";
import Paginate from "../Util/Paginate";
import _ from "lodash";
import useragent from 'express-useragent'


export default () => {
  const router = express.Router({});
  router.post("/login", async (req: Request, res: Response) => {
    try {
      await dbConnect()
      const payload: {
        username: string;
        password: string;
        testing: boolean;
        type: "website" | "admin";
      } = req.body.payload;
      let shippingAddress: any = '';
      const sessionExpiresIn = getConfig("SESSION_EXPIRES_ON");
      const userAgent: string = getUserAgent(req);
      const ip: string = getIp(req);
      // const username = new RegExp(`^${payload.username}$`, "i");
      const user: IMUser | null = await Modal.MUser.findOne({
        $or: [
          {
            email: payload.username,
          },
          {
            mobile: `+91${payload.username}`,
          },
        ],
        userType: payload.type == "admin" ? 0 : 1,
      });
      if (!user) {
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.INVALID_CREDENTIALS,
        });
      }
      if (user.status === ActiveStatus.inactive)
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.DEACTIVATED_USER,
        });
      let id: string = objectIdToString(user._id) as string;
      const checkPassword: boolean = Password.checkPassword(
        payload.password,
        user.password,
        id
      );
      if (checkPassword) {
        const redisToken = await Redis.create({
          userId: id,
          ip: ip,
          additionalInfo: {
            userAgent: userAgent,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            userType: user.userType,
          },
        });
        var source: any = req.headers['user-agent']
        var ua = useragent.parse(source)


        await Modal.MLoginLog.create({
          userId: id,
          userName: user.name,
          userType: user.userType,
          token: redisToken,
          ip,
          userAgent,
          device: ua.isDesktop ? "Desktop" : ua.isMobile ? "Mobile" : ua.isTablet ? "Tablet" : null
        });
        return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
          error: "",
          data: {
            _id: id,
            token: redisToken,
            sleepTimeOut: sessionExpiresIn,
            email: user.email,
            name: user.name,
            mobile: user.mobile,
            userType: user.userType,
          },
        });

      } else
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.INVALID_CREDENTIALS,
        });
    } catch (error: any) {
      console.log(error)
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  });
  router.get("/session", Auth, async (req: IRequestUser, res: Response) => {
    try {
      const token = req.headers[AuthHeader];
      const roleId: string = req.user?.roleId as string;
      const sessionExpiresIn = getConfig("SESSION_EXPIRES_ON");
      const userDetails: IMUser = (await Modal.MUser.findOne({
        _id: req.user?.id,
      })) as IMUser;
      return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
        error: "",
        data: {
          _id: req.user?.id,
          token: token,
          sleepTimeOut: sessionExpiresIn,
          email: userDetails && userDetails.email,
          name: userDetails && userDetails.name,
          mobile: userDetails && userDetails.mobile,
          userType: userDetails.userType,
        },
      });
    } catch (error: any) {
      console.log(error)
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.post("/forget-password", async (req: Request, res: Response) => {
    try {
      await dbConnect()
      const payload: {
        username: string;
      } = req.body.payload;

      const username = new RegExp(`^${payload.username}$`, "i");

      let mobilePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
      // /^(\+\d{1,3}[- ]?)?\d{10}$/;
      let emailPattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      // /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

      let user_mobileNo = mobilePattern.test(payload.username);
      let user_emailID = emailPattern.test(payload.username);

      const user: IMUser | null = await Modal.MUser.findOne({
        $or: [
          {
            email: { $regex: username },
          },
          {
            mobile: `+91${payload.username}`,
          },
        ],
      });
      if (!user)
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.EMAIL_OR_PHONE_NUMBER_NOT_VALID,
        });
      const createOtpPayload: {
        otp: string;
        tokenString: string;
      } = await createOtp(VerifyRequestType.FORGET_PASSWORD, user._id);
      if (user_emailID) {
        // const { error, data } = (await axios.post(`${getConfig('NOTIFICATION_MS_API_URL')}/notification/send`, {
        //   payload: [{
        //     user_id: user._id,
        //     notifications: [{
        //       type: 'email',
        //       data: {
        //         'OTP': createOtpPayload.otp,
        //         'nextYear': moment().format('YYYY')
        //       }
        //     }],
        //     keyword: user.userType == 1 ? 'V_PS_RECOVERY' : user.userType == 2 ? 'PS_RECOVERY' : 'A_PS_RECOVERY'
        //   }]
        // })).data;
        // if (error)
        //   throw new Error(error)
      } else {
        // const { error, data } = (await axios.post(`${getConfig('NOTIFICATION_MS_API_URL')}/notification/send`, {
        //   payload: [{
        //     user_id: user._id,
        //     notifications: [{
        //       type: 'sms',
        //       data: {
        //         'var': createOtpPayload.otp
        //       }
        //     }],
        //     keyword: user.userType == 1 ? 'V_PS_RECOVERY' : user.userType == 2 ? 'PS_RECOVERY' : 'A_PS_RECOVERY'
        //   }]
        // })).data;
        // if (error)
        //   throw new Error(error)

      }
      return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
        error: "",
        data: {
          token: createOtpPayload.tokenString,
        },
      });
    } catch (error: any) {
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  });

  //Login with OTP
  router.post("/createOTP", async (req: Request, res: Response) => {
    try {
      await dbConnect()
      const payload: {
        username: string;
      } = req.body.payload;

      const username = new RegExp(`^${payload.username}$`, "i");

      let mobilePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
      let emailPattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      // console.log(username,'username')
      let user_mobileNo = mobilePattern.test(payload.username);
      let user_emailID = emailPattern.test(payload.username);

      const user: IMUser | null = await Modal.MUser.findOne({
        $or: [
          {
            email: { $regex: username },
          },
          {
            mobile: `+91${payload.username}`,
          },
        ],
      });
      // console.log(user, 'user');

      if (!user)
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.OTP_FOR_EMAIL_OR_PHONE_NUMBER_NOT_VALID,
        });
      const createOtpPayload: {
        otp: string;
        tokenString: string;
      } = await createOtp(VerifyRequestType.LOGIN_WITH_OTP, user._id);

      if (user_emailID) {
        // const { error, data } = (await axios.post(`${getConfig('NOTIFICATION_MS_API_URL')}/notification/send`, {
        //   payload: [{
        //     user_id: user._id,
        //     notifications: [{
        //       type: 'email',
        //       data: {
        //         'OTP': createOtpPayload.otp,
        //         'nextYear': moment().format('YYYY')
        //       }
        //     }],
        //     keyword: 'LOGIN_WITH_OTP'
        //   }]
        // })).data;
        // if (error)
        //   throw new Error(error)
      } else {
        // const { error, data } = (await axios.post(`${getConfig('NOTIFICATION_MS_API_URL')}/notification/send`, {
        //   payload: [{
        //     user_id: user._id,
        //     notifications: [{
        //       type: 'sms',
        //       data: {
        //         'var': createOtpPayload.otp
        //       }
        //     }],
        //     keyword: 'LOGIN_WITH_OTP'
        //   }]
        // })).data;
        // if (error)
        //   throw new Error(error)

      }

      return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
        error: "",
        data: {
          token: createOtpPayload.tokenString,
        },
      });
    } catch (error: any) {
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  });


  //verify login with OTP
  router.post("/loginWithOTP/verify", async (req: Request, res: Response) => {
    try {
      await dbConnect()
      const token = req.headers[verifyTokenHeader];
      const payload: {
        otp: string;
        type: "website" | "admin";
      } = req.body.payload;


      const sessionExpiresIn = getConfig("SESSION_EXPIRES_ON");
      const userAgent: string = getUserAgent(req);
      const ip: string = getIp(req);

      if (!token) {
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
        });
      }

      const tokenPayload: {
        type: VerifyType;
        requestType: VerifyRequestType;
        _id: string;
        time: number;
      } = JSON.parse(Encryption.decrypt(token as string));

      const verifyToken: IMVerifyLog | null = await Modal.MVerifyLog.findOne({
        userId: tokenPayload._id,
        "data.tokenString": token,
        "data.otp": payload.otp,
        requestType: tokenPayload.requestType,
        type: VerifyType.OTP,
      });
      if (!verifyToken) {

        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.INVALID_OTP,
        });

      } else if (verifyToken.matchedOn) {

        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
        });

      } else if (moment().diff(moment(verifyToken.expiredOn), "seconds") > 0) {

        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.VERIFY_TOKEN_EXPIRED,
        });

      } else {

        await Modal.MVerifyLog.updateOne(
          {
            _id: verifyToken._id,
          },
          {
            $set: {
              matchedOn: timeNow(),
            },
          }
        );

        const user: IMUser | null = await Modal.MUser.findOne({
          _id: verifyToken.userId,
          userType: payload.type == "admin" ? 1 : 0,
        });

        if (user) {

          let id: string = objectIdToString(user._id) as string;



          const redisToken = await Redis.create({
            userId: id,
            ip: ip,
            additionalInfo: {
              userAgent: userAgent,
              email: user.email,
              mobile: user.mobile,
              name: user.name,
              userType: user.userType,
            },
          });

          var source: any = req.headers['user-agent']
          var ua = useragent.parse(source)

          await Modal.MLoginLog.create({
            userId: id,
            userName: user.name,
            userType: user.userType,
            token: redisToken,
            ip,
            userAgent,
            device: ua.isDesktop ? "Desktop" : ua.isMobile ? "Mobile" : ua.isTablet ? "Tablet" : null
          })
          return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
            error: "",
            data: {
              _id: id,
              token: redisToken,
              sleepTimeOut: sessionExpiresIn,
              email: user.email,
              name: user.name,
              mobile: user.mobile,
              userType: user.userType,
              // tempPassword: user.tempPassword ? 'yes' : 'no'
            },
          });
        } else {
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.INVALID_CREDENTIALS,
          });
        }
      }
    } catch (error: any) {
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  }
  );



  //Register with OTP
  router.post("/mobileOTP/register", async (req: Request, res: Response) => {
    try {
      await dbConnect()
      const payload: {
        username: string;
      } = req.body.payload;


      let mobilePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/

      let user_mobileNo = mobilePattern.test(payload.username);

      const user: IMUser | null = await Modal.MUser.findOne({
        $or: [
          {
            mobile: `+91${payload.username}`,
          },
        ],
      });


      if (user) {

        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.MOBILE_NUMBER_ALREADY_EXIST,
        });
      }
      if (!user) {
        const createOtpPayload: {
          otp: string;
          tokenString: string;
        } = await createOtp(VerifyRequestType.REGISTER_WITH_OTP, null);

        if (user_mobileNo) {
          // const { error, data } = (await axios.post(`${getConfig('NOTIFICATION_MS_API_URL')}/notification/send`, {
          //   payload: [{
          //     user_id: null,
          //     mobile: payload.username,
          //     notifications: [{
          //       type: '',
          //       data: {
          //         'var': createOtpPayload.otp
          //       }
          //     }],
          //     keyword: 'REGISTRATION_VERIFY'
          //   }]
          // })).data;
          // if (error)
          //   throw new Error(error)

        }




        return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
          error: "",
          data: {
            token: createOtpPayload.tokenString,
          },
        });
      }
    } catch (error: any) {
      console.log(error, 'error');
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  });

  //register verify with OTP

  router.post("/register/verifyOTP", async (req: Request, res: Response) => {
    try {
      await dbConnect()
      const token = req.headers[verifyTokenHeader];
      const payload: {
        otp: string;
      } = req.body.payload;

      if (!token)
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
        });
      const tokenPayload: {
        type: VerifyType;
        requestType: VerifyRequestType;
        _id: string;
        time: number;
      } = JSON.parse(Encryption.decrypt(token as string));


      const verifyToken: IMVerifyLog | null = await Modal.MVerifyLog.findOne({
        userId: tokenPayload._id,
        "data.tokenString": token,
        "data.otp": payload.otp,
        requestType: tokenPayload.requestType,
        type: VerifyType.OTP,
      });


      if (!verifyToken) {
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.INVALID_OTP,
        });
      } else if (verifyToken.matchedOn) {
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
        });
      } else if (moment().diff(moment(verifyToken.expiredOn), "seconds") > 0)
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.VERIFY_TOKEN_EXPIRED,
        });
      else {
        await Modal.MVerifyLog.updateOne(
          {
            "data.tokenString": token,
          },
          {
            $set: {
              matchedOn: timeNow(),
            },
          }
        );

        return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
          error: "",
          data: { success: true },
        });
      }
    } catch (error: any) {
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  }
  );


  router.post(
    "/forget-password/verify-otp",
    async (req: Request, res: Response) => {
      try {
        await dbConnect()
        const token = req.headers[verifyTokenHeader];
        const payload: {
          otp: string;
        } = req.body.payload;

        if (!token)
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
          });
        const tokenPayload: {
          type: VerifyType;
          requestType: VerifyRequestType;
          _id: string;
          time: number;
        } = JSON.parse(Encryption.decrypt(token as string));

        const verifyToken: IMVerifyLog | null = await Modal.MVerifyLog.findOne({
          userId: tokenPayload._id,
          "data.tokenString": token,
          "data.otp": payload.otp,
          requestType: tokenPayload.requestType,
          type: VerifyType.OTP,
        });
        if (!verifyToken) {
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.INVALID_OTP,
          });
        } else if (verifyToken.matchedOn) {
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
          });
        } else if (moment().diff(moment(verifyToken.expiredOn), "seconds") > 0)
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.VERIFY_TOKEN_EXPIRED,
          });
        else {
          await Modal.MVerifyLog.updateOne(
            {
              _id: verifyToken._id,
            },
            {
              $set: {
                matchedOn: timeNow(),
              },
            }
          );

          // const { error, data } = (await axios.post(`${getConfig('NOTIFICATION_MS_API_URL')}/notification/send`, {
          //   payload: [{
          //     user_id: tokenPayload._id,
          //     notifications: [{
          //       type: 'email',
          //       data: {
          //         'nextYear': moment().format('YYYY')

          //       }
          //     }],
          //     keyword: 'PASSWORD_RECOVERY_SUCCESS'
          //   }]
          // })).data;
          // if (error)
          //   throw new Error(error)

          return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
            error: "",
            data: { success: true },
          });
        }
      } catch (error: any) {
        return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
          error: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  );

  router.patch(
    "/forget-password/reset",
    async (req: Request, res: Response) => {
      try {
        await dbConnect()
        const token = req.headers[verifyTokenHeader];
        const payload: {
          password: string;
        } = req.body.payload;

        if (!token)
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
          });
        const tokenPayload: {
          type: VerifyType;
          requestType: VerifyRequestType;
          _id: string;
          time: number;
        } = JSON.parse(Encryption.decrypt(token as string));

        const verifyToken: IMVerifyLog | null = await Modal.MVerifyLog.findOne({
          userId: tokenPayload._id,
          "data.tokenString": token,
          requestType: tokenPayload.requestType,
          type: VerifyType.OTP,
          matchedOn: { $ne: null },
        });
        if (!verifyToken) {
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.VERIFY_TOKEN_NOT_VALID,
          });
        } else if (moment().diff(moment(verifyToken.expiredOn), "seconds") > 0)
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.VERIFY_TOKEN_EXPIRED,
          });
        if (!Password.validatePassword(payload.password))
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.PASSWORD_VALIDATION_FAILED,
          });
        else {
          await updatePassword(verifyToken.userId as string, payload.password);
          return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
            error: "",
            data: { success: true },
          });
        }
      } catch (error: any) {
        return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
          error: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  );

  router.patch(
    "/change-password",
    Auth,
    async (req: IRequestUser, res: Response) => {
      try {
        const loginUser: string = req.user?.id as string;
        const payload: {
          oldPassword: string;
          newPassword: string;
        } = req.body.payload;
        const user: IMUser | null = await Modal.MUser.findOne({
          _id: loginUser,
        }).exec();
        if (!user) throw new Error(ErrorCode.BAD_REQUEST);
        if (
          !Password.checkPassword(payload.oldPassword, user.password, loginUser)
        )
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.MISMATCH_OLD_PASSWORD,
          });
        if (payload.oldPassword === payload.newPassword)
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.PASSWORDS_SHOULD_BE_DIFFERENT,
          });
        if (!Password.validatePassword(payload.newPassword))
          return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
            error: ErrorCode.PASSWORD_VALIDATION_FAILED,
          });
        await updatePassword(loginUser, payload.newPassword);
        return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
          error: "",
          data: { success: true },
        });
      } catch (error: any) {
        return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
          error: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  );

  router.get("/profile", Auth, async (req: IRequestUser, res: Response) => {
    try {
      let getUser: any;
      const loginUser: string = req.user?.id as string;
      const user: IMUser | null = await Modal.MUser.findOne({
        _id: loginUser,
      }).exec();

      if (!user) throw new Error(ErrorCode.BAD_REQUEST);
      getUser = await Modal.MUser.aggregate([
        {
          $match: {
            _id: Types.ObjectId(loginUser),
          },
        },
      ]);
      return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
        error: "",
        data: { success: true, result: getUser[0] },
      });
    } catch (error: any) {
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.delete("/logout", Auth, async (req: IRequestUser, res: Response) => {
    try {
      const loginUser: string = req.user?.id as string;
      const token = req.headers[AuthHeader];
      await Redis.kill({
        token: token as string,
      });
      await Modal.MLoginLog.updateOne(
        {
          token: req.headers[AuthHeader],
          userId: loginUser,
          ip: getIp(req),
          loggedOut: {
            $eq: null,
          },
          userAgent: getUserAgent(req),
        },
        {
          $set: {
            loggedOut: timeNow(),
          },
        }
      );
      return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
        error: "",
        data: { success: true },
      });
    } catch (error: any) {
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.post(
    "/email-exist",
    Auth,
    async (req: IRequestUser, res: Response) => {
      try {
        const payload: {
          email: string;
          userId: string | boolean;
        } = req.body.payload;
        const emailExists = await emailExist(payload.email, payload.userId);
        if (emailExists)
          return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
            error: "",
            data: { success: true, exists: true },
          });
        else
          return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
            error: "",
            data: { success: true, exists: false },
          });
      } catch (error: any) {
        return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
          error: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  );

  router.post(
    "/mobile-exist",
    Auth,
    async (req: IRequestUser, res: Response) => {
      try {
        const payload: {
          username: string;
          userId: string;
        } = req.body.payload;
        const usernameExists = await mobileExist(
          payload.username,
          payload.userId
        );
        if (usernameExists)
          return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
            error: "",
            data: { success: true, exists: true },
          });
        else
          return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
            error: "",
            data: { success: true, exists: false },
          });
      } catch (error: any) {
        return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
          error: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      }
    }
  );

  router.post("/register", async (req, res) => {
    try {
      await dbConnect()
      const payload: {
        firstname: string;
        lastname: string;
        email: string;
        mobileno: string;
        password: any;
        checkbox: any
      } = req.body.payload;
      const email = new RegExp(`^${payload.email}$`, "i");
      const matchMobile = await Modal.MUser.find({ mobile: `+91${payload.mobileno}` });
      const matchMail = await Modal.MUser.find({ email: { $regex: email } });

      if (matchMobile.length == 0 && matchMail.length == 0) {
        const query1 = await Modal.MUser.create({
          name: getFullName(payload.firstname, payload.lastname),
          lastname: payload.lastname,
          email: payload.email,
          mobile: payload.mobileno,
          password: payload.password,
          userType: UserType.USER,
          createdOn: Date.now(),
        });
        await updatePassword(query1._id, payload.password);
        // const { error, data } = (
        //   await axios.post(
        //     `${getConfig("NOTIFICATION_MS_API_URL")}/notification/send`,
        //     {
        //       payload: [
        //         {
        //           user_id: query1._id,
        //           notifications: [
        //             {
        //               type: "email",
        //               data: {
        //                 'Email': payload.email,
        //                 'mNumber': payload.mobileno,
        //                 'URL': `${getConfig('CUSTOMER_URL')}`,
        //                 'nextYear': moment().format('YYYY')
        //               },
        //             },
        //           ],
        //           keyword: "PR_CREATED",
        //         },
        //       ],
        //     }
        //   )
        // ).data;
        // if (error) throw new Error(error);
        return HTTPResponse.send(res, HTTPResponseCode.SUCCESS, {
          error: "",
          data: { success: true },
        });
      } else {
        return HTTPResponse.send(res, HTTPResponseCode.BAD_REQUEST, {
          error: ErrorCode.EMAIL_EXISTS,
          message: "User Mail Or MobileNo Already Exist",
        });
      }
    } catch (error) {
      console.log(error);
      return HTTPResponse.send(res, HTTPResponseCode.INTERNAL_SERVER_ERROR, {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  });
  return router;
};
