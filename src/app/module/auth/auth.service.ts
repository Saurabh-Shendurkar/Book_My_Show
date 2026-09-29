import { db } from "../../common/config/db";
import { eq } from "drizzle-orm";
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

  const { rawToken, hashedToken } = generateToken();
  //send raw token to user via mail

  //insert user into db
  const [user] = await db
    .insert(usersTable)
    .values({
      firstName,
      lastName,
      email,
      phoneNo,
      password: encryptedPassword,
      verificationToken: hashedToken,
    })
    .returning({ id: usersTable.id });

  return user;
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

export { signUp, signIn, getMe, logout };
