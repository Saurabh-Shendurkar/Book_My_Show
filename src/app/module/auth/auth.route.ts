import {Router} from 'express'
import { signInHandler, signUpHandler } from './auth.controller'
import { parseRequest } from '../../common/middleware/parse.middlware'
import { signUpDto } from './dto/signUp.dto'
import { signInDto } from './dto/signIn.dto'

const router= Router()

router.post("/sign-up",parseRequest(signUpDto),signUpHandler)
router.get("/sign-in",parseRequest(signInDto),signInHandler)

export default router