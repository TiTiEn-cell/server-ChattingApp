const UserModel = require("../models/userModel");
const bcrypt = require('bcrypt')
const asynHandle = require('express-async-handler')
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.USERNAME_MAIL,
      pass: process.env.PASSWORD_MAIL,
    },
  });


const getJsonWebToken = async (phoneNumber, id)=>{
    const payload = {
        phoneNumber, id
    }
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn:'7d',
    })

    return token;
}




const handleSendMail = async(val,email)=>{
   try {
    await transporter.sendMail({
        from: `Support ChattingApp Application <${process.env.USERNAME_MAIL}>`, // sender address
        to: email, // list of receivers
        subject: "Verification email code", // Subject line
        text: "Your code to verification code: ", // plain text body
        html: `<b>${val}</b>`, // html body
      });

      return 'OK';

   } catch (error) {
    return error;
   }
}

const verification = asynHandle(async(req,res)=>{
    const {email} = req.body;
    const verificationCode = Math.round(1000 + Math.random() * 9000)
    try {
        await handleSendMail(verificationCode,email)
        res.status(200).json({
            message: 'Send verification code successfully!!!',
            data:{
                code: verificationCode
            }
          })
    } catch (error) {
        res.status(401)
        throw new Error('Can not send email')
    }
    
})

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
    verification,
}