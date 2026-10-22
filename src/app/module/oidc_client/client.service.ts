import "dotenv/config"
import { db } from "../../common/config/db";
import {applicationsTable, clientsTable } from "./client.schema";
import {eq, and} from "drizzle-orm"
import bcrypt from "bcrypt"
import type { registerClientRequest } from "./dto/registerClient.dto";
import { ApiResponse } from "../../common/utils/api.response";
import { ApiError } from "../../common/utils/api.error";
import { sendEmail } from "../../common/utils/send.email";
import { createAccessToken, createRefreshToken, generateToken, type userPayload } from "../../common/utils/jwt.utils";
import VerifyUserEmail from "../auth/emailTemplate/verifyUser";
import React from "react";
import crypto from "crypto"
import type { loginClientRequest } from "./dto/loginClient.dto";
import type { registerClientAppRequest } from "./dto/registerClientApp.dto";
import type { generateClientSecretRequest } from "./dto/generateSecret.dto";

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

    const sendMailRes=await sendEmail({
        to: clientRequest.clientEmail,
        subject: "Welcome! Please verify your Email",
        template:React.createElement(VerifyUserEmail,{
            firstName:clientRequest.clientFirstName,
            verificationLink:`${process.env.Domain||'http://localhost:3000'}/oidc/verifyClient?token=${rawToken}`
        })
    })
    if(!sendMailRes.success) throw ApiError.serverFailure(`Failed to send mail to ${clientRequest.clientEmail}`)
    return true
}

const verifyClient= async(token:string)=>{
    if(!token) ApiError.badRequest("Missing Token");
    const hashedToken= crypto.createHash("sha256").update(token).digest("hex")

    const [client]=await db.select().from(clientsTable)
    .where(eq(clientsTable.verificationToken,hashedToken))

    if(!client||client?.verificationTokenExpiresAt && client?.verificationTokenExpiresAt< new Date())
         throw ApiError.badRequest("Invalid or Expired Token")
    const [verifiedClient]=await db.update(clientsTable)
        .set({isClientVerified:true, 
            verificationToken:null, 
            verificationTokenExpiresAt:null,
        })
        .where(eq(clientsTable.clientEmail, client.clientEmail)).returning()
    if(!verifiedClient) throw ApiError.serverFailure("Filed to verify the client")
    return true
}

const LoginClient= async(clientRequest:loginClientRequest)=>{
    const hashedPassword= bcrypt.hashSync(clientRequest?.clientPassword,12)
    const [client]=await db.select().from(clientsTable)
    .where(
        and(
            eq(clientsTable.clientEmail,clientRequest.clientEmail),
            eq(clientsTable.clientPassword,hashedPassword)
        )
    )
    if(!client) throw ApiError.badRequest("Invalid email or password")
    const access_token=await createAccessToken({id:client.clientId})
    const refresh_token= await createRefreshToken({id:client.clientId})
    const userObj=await db.update(clientsTable).set({refreshToken:refresh_token})
        .where(eq(clientsTable.clientEmail,client.clientEmail))
    if(!userObj) throw ApiError.serverFailure("Failed to add client refresh token")
    return {access_token, refresh_token}
}

const requestVerification= async(ClientPayload:userPayload)=>{
    const [client]= await db.select().from(clientsTable)
        .where(
            and(
                eq(clientsTable.clientId,ClientPayload.id),
                eq(clientsTable.isClientVerified,false)
            )
        )
    if(!client) throw ApiError.badRequest("User not found or user already verified")
    const {rawToken, hashedToken, expiresAt}=generateToken()
    
    const updatedClient=await db.update(clientsTable)
        .set({verificationToken:hashedToken,
            verificationTokenExpiresAt:expiresAt
        }).returning()
    if(!updatedClient) throw ApiError.serverFailure("Failed to generate verification token")
    
    const sendMailRes= await sendEmail({
        to:client.clientEmail,
        subject:'Please Verify your account vua this email',
        template:React.createElement(VerifyUserEmail,{
            firstName:client.clientFirstName,
            verificationLink:`${process.env.Domain||'http://localhost:3000'}/oidc/verifyClient?token=${rawToken}`
        })
    })
    if(!sendMailRes) throw ApiError.serverFailure("Failed to send verification email to the user")
    return true
}

const getClientInfo= async(clientPayload:userPayload)=>{
    const [client]= await db.select({
        firstName:clientsTable.clientFirstName,
        lastName:clientsTable.clientLastName,
        email:clientsTable.clientEmail,
        mobileNo:clientsTable.clientMobileNo
    }).from(clientsTable)
        .where(
            and(
                eq(clientsTable.clientId,clientPayload.id),
                eq(clientsTable.isClientVerified,true)
            )
        )
    if(!client) throw ApiError.notFound("Invalid token")
    return client
}

const generateClientSecret= async(clientPayload:userPayload, clientRequest:generateClientSecretRequest)=>{
    const [client]= await db.select().from(clientsTable)
        .where(eq(clientsTable.clientId,clientPayload.id))
    if(!client) throw ApiError.notFound("Invalid request")
    const hashedPassword= bcrypt.hashSync(clientRequest.clientPassword,12)
    if(client.clientEmail!==clientRequest.clientEmail&& client.clientPassword!==hashedPassword)
        throw ApiError.notFound("Invalid Username or password")

    if(client.isCurrentClientSecretRevealed) throw ApiError.badRequest("Secret has already been revealed once")
    const clientSecret= crypto.randomBytes(32).toHex()
    const hashedSecret= crypto.createHash('sha256').update(clientSecret).digest()
    const [updatedClient]=await db.update(clientsTable)
        .set({clientSecret:hashedSecret,
            isCurrentClientSecretRevealed:true
        }).returning()
    if(!updatedClient) throw ApiError.serverFailure("Fialed to generate client secret")
    return clientSecret
}

const registerApplication= async(clientRequest:registerClientAppRequest,clientPayload:userPayload)=>{
    const clientId= clientPayload.id
    const [client]=await db.select().from(clientsTable)
    .where(
        and(
            eq(clientsTable.clientId,clientId),
            eq(clientsTable.isClientVerified,true)
    )
    )
    if(!client) throw ApiError.forbidden("Invalid or unverified client")

    const newApp=await db.insert(applicationsTable).values({
        appName:clientRequest.appName,
        appPivacyPolicyUrl:clientRequest.appPrivacyPolicyUrl,
        appUrl:clientRequest.appUrl,
        appLogoUrl:clientRequest.appLogoUrl,
        clientEmail:client.clientEmail,
        userSupportEmail:clientRequest.userSupportEmail,
        redirectUrl:clientRequest.redirectUrl
    }).returning()
    if(!newApp) throw ApiError.serverFailure("Failed to register Application")
    return newApp
}

export {registerClient, verifyClient, LoginClient, registerApplication, requestVerification, getClientInfo}