
export class ApiError extends Error {
    //add properties
    public statusCode: number
    public isOperational: boolean
    //call constructor
    constructor(statusCode: number, message: string) {
        //call parrent constructor
        super(message)
        //give  values from constructor
        this.statusCode = statusCode
        this.isOperational = true
        //keeps error logs reading ApiError
        this.name = this.constructor.name
    }

    static badRequest(message:string="Bad Request"):ApiError{
        return new ApiError(400,message)
    }

    static unAuthorized(message:string="Un Authorized"):ApiError{
        return new ApiError(401,message)
    }

    static notFound(message:string="Not Found"):ApiError{
        return new ApiError(404,message)
    }
}