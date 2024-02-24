const UserModel = require("../models/userModel");
const bcrypt = require('bcrypt')
const asynHandle = require('express-async-handler')
const jwt = require('jsonwebtoken')

const getJsonWebToken = async (phoneNumber, id)=>{
    const payload = {
        phoneNumber, id
    }
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn:'7d',
    })

    return token;
}

const register = asynHandle(async (req, res)=>{
    const {phoneNumber, password} = (req.body);
 
    const existingPhoneNumer = await UserModel.findOne({phoneNumber})
    if(existingPhoneNumer){
        res.status(401);
        throw new Error('User has already exit!!!')
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt)

    const newUser = new UserModel({
        phoneNumber,
        password: hashedPassword
    })

    await newUser.save()

    

    res.status(200).json({
        message:'Register new user successfully',
        data: {
            ...newUser,
            accesstoken: await getJsonWebToken(phoneNumber, newUser.id),
        }
    })
})

module.exports = {
    register,
}