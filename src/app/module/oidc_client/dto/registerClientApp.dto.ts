import {z} from "zod"

export const registerClientAppDto= z.object({
    appName:z.string().trim().max(100),
    userSupportEmail:z.email().max(322),
    appUrl:z.url(),
    appLogoUrl:z.url(),
    appPrivacyPolicyUrl:z.url(),
    redirectUrl:z.url()
})

export type registerClientAppRequest= z.infer<typeof registerClientAppDto>