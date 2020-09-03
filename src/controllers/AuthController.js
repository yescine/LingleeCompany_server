import UserModel from "../models/User";
import PasswordService from "../services/PasswordService";
import ClientError from "../exeptions/ClientError";
import TryCatchErrorDecorator from "../decorators/TryCatchErrorDecorator";
import TokenService from "../services/TokenService";
import AppError from "../exeptions/AppError";
import MailService from "../services/MailService";
import randomize from "../utils/randomize";
import config from "../config/app";

class AuthController {
  @TryCatchErrorDecorator
  static async signin(req, res) {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      throw new ClientError("User not found", 404);
    }

    const checkPassword = await PasswordService.checkPassword(
      req.body.password,
      user.password
    );

    if (!checkPassword) {
      throw new ClientError("Incorrect email or password", 401);
    }

    const accessToken = await TokenService.createAccessToken(user);
    const refreshTokenHash = await TokenService.createRefreshToken(user);
    const refreshToken = await TokenService.addRefreshTokenUser(
      user,
      refreshTokenHash
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  }

  @TryCatchErrorDecorator
  static async signup(req, res) {
    const isAlreadyUser = await UserModel.findOne({ email: req.body.email });
    if (isAlreadyUser) {
      throw new ClientError("This email is already registered", 409);
    }

    const password = randomize.generateString(12);

    const user = new UserModel({
      name: req.body.name,
      email: req.body.email,
      password: await PasswordService.hashPassword(password)
    });

    await user.save();

    MailService.sendWithDraft(
      {
        email: user.email,
        subject: "Thanks for registering, your password is inside",
        password,
        link:'localhost:3000'+'/restore-password', //config.app.frontendHost;
        template:'signup-verify'
      },
    );

    res.json({ status: "success" });
  }

  @TryCatchErrorDecorator
  static async refreshTokens(req, res) {
    const refreshTokenRequest = req.body.refreshToken;

    const verifyData = await TokenService.verifyRefreshToken(
      refreshTokenRequest
    );

    if (!verifyData) {
      throw new ClientError("Refresh token invalid or expired", 400);
    }

    const user = await UserModel.findOne({ _id: verifyData.id });

    const isValid = await TokenService.checkRefreshTokenUser(
      user,
      refreshTokenRequest
    );

    if (!isValid) {
      throw new ClientError("Refresh token invalid or expired", 400);
    }

    await TokenService.removeRefreshTokenUser(user, refreshTokenRequest);

    const accessToken = await TokenService.createAccessToken(user);
    const refreshTokenHash = await TokenService.createRefreshToken(user);
    const refreshToken = await TokenService.addRefreshTokenUser(
      user,
      refreshTokenHash
    );

    res.json({ accessToken, refreshToken });
  }

  @TryCatchErrorDecorator
  static async logout(req, res, next) {
    const user = await UserModel.findOne({ _id: req.userId });
    if (!user) {
      throw new AppError("UserId not found in request", 401);
    }

    user.refreshTokens = [];
    await user.save();

    res.json({ status: "success" });
  }

  @TryCatchErrorDecorator
  static async restorePassword(req, res, next) {
    const user = await UserModel.findOne({ email: req.body.email });
    console.log('new password',req.body.password)

    if (!user) {
      throw new ClientError("User not found", 404);
    }
    
    // change password here;
    await user.update({restorePassword: await PasswordService.hashPassword(req.body.password)})

    const token = await TokenService.createRestorePasswordToken(user);

    MailService.sendWithDraft(
      {
        email: user.email,
        subject: "Restore password",
        password:req.body.password,
        link:'localhost:3000'+'/confirm-restore-password/'+token, //config.app.frontendHost;
        template:'restore-password'
      },
    );

    res.json({ status: "success" });
  }

  @TryCatchErrorDecorator
  static async confirmRestorePassword(req, res, next) {
    const tokenRequest = req.body.token;

    const verifyData = await TokenService.verifyRestorePasswordToken(
      tokenRequest
    );

    if (!verifyData) {
      throw new ClientError("Refresh token invalid or expired", 400);
    }

    const user = await UserModel.findOne({ _id: verifyData.id });

    await user.update({password: user.restorePassword })

    MailService.sendWithDraft(
      {
        email: user.email,
        subject: "New password",
        template:'confirm-restore-password'
      },
    );

    res.json({ status: "success" });
  }
}

export default AuthController;
