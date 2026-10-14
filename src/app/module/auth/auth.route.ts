import {Router} from 'express'
import { forgotPasswordHandler, getMeHandler, logoutHandler, signInHandler, signUpHandler, verficationHandler, resetPasswordHandler, refreshHandler } from './auth.controller'
import { parseRequest } from '../../common/middleware/parse.middlware'
import { signUpDto } from './dto/signUp.dto'
import { signInDto } from './dto/signIn.dto'
import { restrictUnAuthenticatedUser } from './auth.middleware'
import { forgotPasswordDto } from './dto/forgotPassword.dto'
import { resetPasswordDto } from './dto/resetPassword.dto'

const router= Router()

router.post("/sign-up",parseRequest(signUpDto),signUpHandler)
router.post("/sign-in",parseRequest(signInDto),signInHandler)
router.post("/me",restrictUnAuthenticatedUser(),getMeHandler)
router.post("/logout",restrictUnAuthenticatedUser(),logoutHandler)
router.get("/verify",verficationHandler)
router.post("/forgot-password",parseRequest(forgotPasswordDto), forgotPasswordHandler)
router.post("/reset-password",parseRequest(resetPasswordDto), resetPasswordHandler)
router.post("/refresh",refreshHandler)
export default router