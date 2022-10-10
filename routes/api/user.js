import debug from 'debug';
const debugMain = debug('app:routes:user');
import express from 'express';
import moment from 'moment';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import * as dbModule from '../../database.js';
import Joi from 'joi';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';
import { ObjectId } from 'mongodb';


//FIXME: use this array to store user data in for now
//we will replace this with a database later

const newUserSchema = Joi.object({
  email: Joi.string().trim().min(1).email().required(),
  password: Joi.string().trim().min(1).required(),
  givenName: Joi.string().trim().min(1).required(),
  familyName: Joi.string().trim().min(1).required(),
  role: Joi.string().trim().min(1).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().min(1).email().required(),
  password: Joi.string().trim().min(1).required(),
})

const updateUserSchema = Joi.object({
  email: Joi.string().trim().min(1).email(),
  password: Joi.string().trim().min(1),
  givenName: Joi.string().trim().min(1),
  familyName: Joi.string().trim().min(1),
  fullName: Joi.string().trim().min(1),
  role: Joi.string().trim().min(1),
});




//create router
const router = express.Router();

//register routes
router.get('/list', async (req,res,next) => {
  try {
    const users = await dbModule.listAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/:userId', validId('userId'), async (req,res,next) => {
  try{ 
    const userId = req.userId;
    const user = await dbModule.findUserById(userId);
    if (!user) {
      res.status(404).json({ error: `User ${userId} not found` });
    } else {
      res.json(user);
    }
  } catch (err) {
    next(err);
  }

});

router.post('/register', validBody(newUserSchema), async (req,res,next) =>{

  try {
  const {email,password,givenName,familyName,role} = req.body;
  const fullName = givenName + ' ' + familyName;

  const _id = await dbModule.newId();

  const newUser ={
    _id,
    email,
    password,
    givenName,
    familyName,
    fullName,
    role,
    creationDate: new Date()
  };


  // if (!email){
  //   res.status(400).json({error: 'Email Required'});
  // }
  // else if (!password) {
  //   res.status(400).json({error: 'Password Required'});
  // }
  // else if (!givenName) {
  //   res.status(400).json({error: 'Given Name Required'});
  // }
  // else if (!familyName) {
  //   res.status(400).json({error: 'Family Name Required'});
  // }
  // else if (!role) {
  //   res.status(400).json({error: 'Role Required'});
  // }
  // else {
    let emailExists = await dbModule.checkEmail(newUser.email);
    if (emailExists == false){
    res.status(200).json('New User Registered');

    await dbModule.insertUser(newUser);
    }
    else {
      res.status(400).json({error: 'Email Already Registered'});
    }
  // }
}
catch (err) {
  next(err);
} 
});

router.post('/login', validBody(loginSchema), async (req,res,next) =>{
  //FIXME: check user's email and password and send response as json
  try {
  const email = req.body.email;
  const password = req.body.password;

  // let foundUser = false;

//   if (!email || !password){
//     res.status(400).json({error: 'Please Enter Your Login Credentials'});
//   }
// else {
  const user = await dbModule.findUserByEmail(email);
  if (user.password == password){
  res.status(200).json(`Welcome Back! ${user._id}`);
  }
  else {
    res.status(400).json({error: 'Invalid login credential provided. Please try again.'})
  }
} catch (err) {
  next(err);
}
// }
});


router.put('/:userId', validId('userId'), validBody(updateUserSchema), async (req,res,next) =>{
  //FIXME: update existing user and send response as json
  const userId = req.userId;
  // const {email,password,givenName,familyName,role} = req.body;
  const user = await dbModule.findUserById(userId);
  const updatedUser = req.body;

  

  if(!user){
    res.status(404).json({error:'User Not Found'});
  }else {
    await dbModule.updateUser(userId, updatedUser);
    res.status(200).json(`User ${userId}  updated` );
  }

});

router.delete('/:userId', validId('userId'), async (req,res,next) =>{
  //FIXME: delete user and send response as json
  try {
  const userId = req.userId;
  debugMain(userId);
  const user = await dbModule.findUserById(userId);
 if(!user) {
res.status(400).json({error: `User ${userId} not found.`});
 }
else {
  await dbModule.deleteUser(userId);
  res.status(200).json(`User ${userId} Deleted`)
}
  } catch (err) {
    next (err);
  }
});

//export router
export {router as userRouter};