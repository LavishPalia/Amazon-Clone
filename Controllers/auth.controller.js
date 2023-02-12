import crypto from 'crypto';
import { token } from 'morgan';
import User from '../models/user.schema.js';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';
import mailHelper from '../utils/mailHelper';

export default cookieOptions = {
  expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  httpOnly: true,
};

/*****************************************
 * @SIGNUP
 * @route           /api/auth/signup
 * @description     Create new user
 * @parameters      name, email, password
 * @returns         User object, auth token
 *****************************************/
export const signUp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new CustomError('Please provide all fields', 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new CustomError('User already exists', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = user.getJwtToken();
  // console.log(user);
  user.password = undefined;

  res.cookie('token', token, cookieOptions);
  res.status(200).json({
    success: true,
    token,
    user,
  });
});

/*****************************************
 * @Login
 * @route           /api/auth/login
 * @description     Login user
 * @parameters      email, password
 * @returns         User object, auth token
 *****************************************/
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError('Please provide all fields', 400);
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new CustomError('Invalid Credentials', 400);
  }

  const isPassMatch = await user.comparePassword(password);
  if (!isPassMatch) {
    throw new CustomError('Invalid Credentials', 400);
  }

  const token = user.getJwtToken();
  user.password = undefined;

  res.cookie('token', token, cookieOptions);
  res.status(200).json({
    success: true,
    token,
    user,
  });
});

/*****************************************
 * @Logout
 * @route           /api/auth/logout
 * @description     Logout user by clearing user cookies
 * @parameters
 * @returns         success message
 *****************************************/
export const logout = asyncHandler(async (_req, res) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out',
  });
});

/*****************************************
 * @FORGOT_PASSWORD
 * @route           /api/auth/password/forgot
 * @description     user will submit email and we will generate a token
 * @parameters      email
 * @returns         success message - email sent
 *****************************************/
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  const resetToken = user.generateForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/password/reset/${resetToken}`;

  const text = `your password reset url is \n\n ${resetUrl} \n\n`;
  try {
    await mailHelper({
      email: user.email,
      subject: 'Password Reset Email',
      text: text,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (err) {
    // claer token and its expiry in database
    (user.forgotPasswordToken = undefined),
      (user.forgotPasswordExpiry = undefined),
      await user.save({ validateBeforeSave: false });

    throw new CustomError(err.message || 'Email sent failure', 500);
  }
});

/*****************************************
 * @RESET_PASSWORD
 * @route           /api/auth/password/reset/:resetToken
 * @description     user will be able to reset password based on url token
 * @parameters      token from url, password, confirm password
 * @returns         User object
 *****************************************/

export const resetPassword = asyncHandler(async (req, res) => {
  const { token: resetToken } = req.params;
  const { password, confirmPassword } = req.body;

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    forgotPasswordToken: resetPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new CustomError('Password token is not valid or expired', 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError('Password and confirmPassword does not match.', 400);
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  const token = user.getJwtToken();
  user.password = undefined;

  res.cookie('token', token, cookieOptions);
  res.status(200).json({
    success: true,
    user,
  });
});
