import {Router} from 'express'
import { getMeHandler, logoutHandler, signInHandler, signUpHandler } from './auth.controller'
import { parseRequest } from '../../common/middleware/parse.middlware'
import { signUpDto } from './dto/signUp.dto'
import { signInDto } from './dto/signIn.dto'
import { restrictUnAuthenticatedUser } from './auth.middleware'

const router= Router()

router.post("/sign-up",parseRequest(signUpDto),signUpHandler)
router.get("/sign-in",parseRequest(signInDto),signInHandler)
router.post("/get-me",restrictUnAuthenticatedUser(),getMeHandler)
router.post("/logout",restrictUnAuthenticatedUser(),logoutHandler)
export default router