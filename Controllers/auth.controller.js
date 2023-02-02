import User from '../models/user.schema.js'
import asyncHandler from '../services/asyncHandler'
import CustomError from '../utils/customError'

export default cookieOptions = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: true,
}


/*****************************************
 * @SIGNUP
 * @route           /api/auth/signup
 * @description     Create new user
 * @parameters      name, email, password
 * @returns         User object
 *****************************************/
export const signUp = asyncHandler(async(req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password) {
        throw new CustomError('Please provide all fields', 400);
    }

    const existingUser = await User.findOne({email});

    if(existingUser) {
        throw new CustomError('User already exists', 400);
    }

    const user = await User.create({
        name,
        email,
        password
    })

    const token = user.getJwtToken()
    // console.log(user);

    user.password = undefined;

    res.cookie("token", token, cookieOptions);
    res.status(200).json({
        success: true,
        token,
        user
    })
})