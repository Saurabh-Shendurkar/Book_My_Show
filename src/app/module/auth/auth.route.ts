import {Router} from 'express'
import { signUpHandler } from './auth.controller'
import { parseRequest } from '../../common/middleware/parse.middlware'
import { signUpDto } from './dto/signUp.dto'

const router= Router()

router.post("/signup",parseRequest(signUpDto),signUpHandler)


export default router