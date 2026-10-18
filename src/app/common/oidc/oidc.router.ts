import { Router } from "express";
import {jwksHandler, oidcHandler} from "./oidc.controller";

const router = Router()

router.get("/openid-configuration",oidcHandler)
router.get("/jwks.json",jwksHandler)
export default router