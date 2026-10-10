import "dotenv/config"
import { db } from "../../common/config/db";
import {eq} from "drizzle-orm";
import type { signUpRequest } from "./dto/signUp.dto";
import { usersTable } from "./auth.schema";
import { ApiError } from "../../common/utils/api.error";
import {
  createAccessToken,
  createRefreshToken,
  generateToken,
  type userPayload,
} from "../../common/utils/jwt.utils";
import bcrypt from "bcrypt";
import type { signInRequest } from "./dto/signIn.dto";
import crypto from "crypto"
import { sendEmail } from "../../common/utils/send.email";
import type { forgotPasswordRequest } from "./dto/forgotPassword.dto";
import type { resetPasswordRequest } from "./dto/resetPassword.dto";
import type { verifyEmailRequest } from "./dto/verifyEmail.dto";

//email templates
import React from "react";
import VerifyUserEmail from "./emailTemplate/verifyUser";
import ResetPasswordEmail from "./emailTemplate/resetPassword";


const signUp = async (userData: signUpRequest) => {
  const { firstName, lastName, email, phoneNo, password } = userData;
  const userSearchRes = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (userSearchRes.length > 0)
    throw ApiError.badRequest("User with this email already exists.");
  //encrypt password
  const encryptedPassword = bcrypt.hashSync(password, 12);

  const { rawToken, hashedToken, expiresAt } = generateToken();

    // send raw token to user via mail
  const sendMailResult=await sendEmail({
    to: email,
    subject: "Welcome! Please verify your email",
    template: React.createElement(VerifyUserEmail, { 
      firstName, 
      verificationLink: `${process.env.DOMAIN || 'http://localhost:3000'}/api/auth/verify?token=${rawToken}` 
    })
  });
  if(!sendMailResult.success) throw ApiError.serverFailure(String(sendMailResult.error))

  //insert user into db
  const user = await db
    .insert(usersTable)
    .values({
      firstName,
      lastName,
      email,
      phoneNo,
      password: encryptedPassword,
      verificationToken: hashedToken,
      verificationTokenExpiresAt: expiresAt,
    })
  return true;
};

const signIn = async (userData: signInRequest) => {
  const { email, password } = userData;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (!user) throw ApiError.badRequest("Invalid Email or Password");
  const isPasswordMatch = await bcrypt.compare(password, user.password!);
  if (!isPasswordMatch) throw ApiError.badRequest("Invalid Email or Password");

  if (!user.isEmailverified)
    throw ApiError.unAuthorized("User is not verified");

  const access_token = createAccessToken({ id: user.id });
  const refresh_token = createRefreshToken({ id: user.id });

  await db
    .update(usersTable)
    .set({ refreshToken: refresh_token })
    .where(eq(usersTable.id, user.id));

  const userObj = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNo: user.phoneNo,
  };
  return { userObj, access_token, refresh_token };
};

const getMe = async (userData: userPayload) => {
  const [userSearchRes] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userData.id));
  if (!userSearchRes) throw ApiError.notFound("User Not Found");

  return {
    firstName: userSearchRes.firstName,
    lastName: userSearchRes.lastName,
    email: userSearchRes.email,
    phoneNo: userSearchRes.phoneNo,
  };
};

const logout = async (userData: userPayload) => {
  const [userSearchRes] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userData.id));

  if (!userSearchRes) throw ApiError.notFound("User Not Found");
  //set refresh token in db to null
  await db
    .update(usersTable)
    .set({ refreshToken: null })
    .where(eq(usersTable.id, userData.id));

  return { user: {}, accessToken: null};
};

const verifyEmail= async(token:string)=>{
  if(!token) throw ApiError.unAuthorized("Missing Token")
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.verificationToken, hashedToken));
    
  if (!user) throw ApiError.badRequest("Invalid verification token");
  
  if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
    throw ApiError.badRequest("Verification token has expired");
  }

  await db
    .update(usersTable)
    .set({ verificationToken: null, isEmailverified: true, verificationTokenExpiresAt: null })
    .where(eq(usersTable.email, user.email));

  return ({
    firstName:user.firstName,
    lastName:user.lastName,
    email:user.email
  })
}

const forgotPassword= async(userData:forgotPasswordRequest)=>{
  const email= userData.email
  const [user]= await db.select().from(usersTable).where(eq(usersTable.email,email))
  if(!user) throw ApiError.notFound("User Not Found")
  const {rawToken,hashedToken,expiresAt}=generateToken(5)

  const sendResetPasswordMailResult=await sendEmail({
    to:email,
    subject:'Reset Password Email',
    template:React.createElement(ResetPasswordEmail,{
      firstName:user.firstName,
      resetLink:`${process.env.DOMAIN||'http://localhost:3000'}/api/auth/reset-password?token=${rawToken}`
    })
  })

  if(!sendResetPasswordMailResult.success) throw ApiError.serverFailure(String(sendResetPasswordMailResult.error))
  
  const updatedUser=await db.update(usersTable).set({resetPasswordToken:hashedToken,resetPasswordTokenExpiresAt:expiresAt}).where(eq(usersTable.email,email))
  if(!updatedUser) throw ApiError.serverFailure("Failed to process the request")
}

const resetPassword= async(userData:resetPasswordRequest)=>{
  if(!userData.token)throw ApiError.badRequest("Missing token")
  const hashedToken=crypto.createHash('sha256').update(userData.token).digest('hex')
  const [user]= await db.select().from(usersTable).where(eq(usersTable.resetPasswordToken,hashedToken))
  if(!user) throw ApiError.notFound("Invalid Reset Password Token")
  if(user.resetPasswordTokenExpiresAt&& user.resetPasswordTokenExpiresAt<new Date()){
    throw ApiError.badRequest("Reset Password Token expired")
  }
  const encryptedPassword = bcrypt.hashSync(userData.password, 12);
  await db.update(usersTable).set({password:encryptedPassword,resetPasswordToken:null,resetPasswordTokenExpiresAt:null})

  return{
    firstName:user.firstName,
    lastName:user.lastName,
    email:user.email
  }
}
export { signUp, signIn, getMe, logout, verifyEmail, forgotPassword, resetPassword };
