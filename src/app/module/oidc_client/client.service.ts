import "dotenv/config"
import { db } from "../../common/config/db";
import {clientsTable } from "./client.schema";
import {eq} from "drizzle-orm"
import bcrypt from "bcrypt"
import type { registerClientRequest } from "./dto/registerClient.dto";
import { ApiResponse } from "../../common/utils/api.response";
import { ApiError } from "../../common/utils/api.error";
import { sendEmail } from "../../common/utils/send.email";
import { generateToken } from "../../common/utils/jwt.utils";
import VerifyUserEmail from "../auth/emailTemplate/verifyUser";
import React from "react";


const registerClient= async(clientRequest:registerClientRequest)=>{
    if(!clientRequest) throw ApiError.badRequest("Invalid request")
    const [existingClient]=await db.select().from(clientsTable)
    .where(eq(clientsTable.clientEmail,clientRequest.clientEmail))
    if (existingClient) return "Client Already Exisits"

    const hashedPassword=bcrypt.hashSync(clientRequest.clientPassword,12)
    const {rawToken,hashedToken,expiresAt}= await generateToken()
    const newClient=await db.insert(clientsTable).values({
        clientEmail:clientRequest.clientEmail,
        clientFirstName:clientRequest.clientFirstName,
        clientLastName:clientRequest.clientLastName,
        clientMobileNo:clientRequest.clientMobileNo,
        clientPassword:hashedPassword,
        verificationToken:hashedToken,
        verificationTokenExpiresAt:expiresAt
    }).returning()
    if(!newClient) throw ApiError.serverFailure("Failed to register new client.")
    
    //send email
    sendEmail({
        to:clientRequest.clientEmail,
        subject:"Welcome! Please verify your Email",
        template:React.createElement(VerifyUserEmail,{
            firstName:clientRequest.clientFirstName,
            verificationLink:verificationLink: `${process.env.DOMAIN || 'http://localhost:3000'}/api/auth/verify?token=${rawToken}`
        })
    })
}