import { Router } from "express";
import oidcHandler from "./oidc.controller";

const router = Router()

router.get("/openid-configuration",oidcHandler)

export default router