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
            phoneNumber: newUser.phoneNumber,
            id: newUser.id,
            accesstoken: await getJsonWebToken(phoneNumber, newUser.id),
        }
    })
})

const login = asynHandle(async (req, res) =>{
    const {phoneNumber, password} = req.body;
    const existingUser = await UserModel.findOne({phoneNumber})

    if(!existingUser){
        res.status(403);
        throw new Error('User not found!!!');
    }

    const isMatchPassword = await bcrypt.compare(password, existingUser.password)

    console.log(isMatchPassword)

    if(!isMatchPassword){
        res.status(401);
        throw new Error('Phone number or Password is not correct')
    }

    res.status(200).json({
        message:'login successfully',
        data:{
            id: existingUser.id,
            phoneNumber: existingUser.phoneNumber,
            accesstoken: await getJsonWebToken(phoneNumber, existingUser.id)
        }
    })
})

module.exports = {
    register,
    login,
}