import { db } from "../../common/config/db";
import { eq } from "drizzle-orm";
import type { signUpRequest } from "./dto/signUp.dto";
import { usersTable } from "./auth.schema";
import { ApiError } from "../../common/utils/api.error";
import { generateToken } from "../../common/utils/jwt.utils";
import bcrypt from "bcrypt";

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

export { signUp };
