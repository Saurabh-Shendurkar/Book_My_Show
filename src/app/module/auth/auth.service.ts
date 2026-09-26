import { db } from "../../common/config/db";
import { eq }from "drizzle-orm"
import type{ signUpRequest } from "./dto/signUp.dto";
import { usersTable } from "./auth.schema";
import { ApiError } from "../../common/utils/api.error";


const signUp= async(userData:signUpRequest)=>{
    const {firstName,lastName,email,phone_no, password}=userData
    const userSearchRes=await db.select().from(usersTable).where(eq(usersTable.email,email))
    if(userSearchRes.length>0) throw ApiError.badRequest("User with this email already exists.")
    //do something with password 

    //insert user into db 
    const [user]=await db.insert(usersTable)
    .values({firstName,lastName,email,password,salt:null})
    .returning({id:usersTable.id})
    
    return user
}

export {signUp}