import debug from 'debug';
const debugMain = debug('app:routes:user');
import express from 'express';
import moment from 'moment';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import * as dbModule from '../../database.js';

//FIXME: use this array to store user data in for now
//we will replace this with a database later


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

router.get('/:userId', async (req,res,next) => {
  try{ 
    const userId = dbModule.newId(req.params.userId);
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

router.post('/register', async (req,res,next) =>{

  try {
  const {email,password,givenName,familyName,role} = req.body;
  const fullName = givenName + ' ' + familyName;

  const _id = nanoid();

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


  if (!email){
    res.status(400).json({error: 'Email Required'});
  }
  else if (!password) {
    res.status(400).json({error: 'Password Required'});
  }
  else if (!givenName) {
    res.status(400).json({error: 'Given Name Required'});
  }
  else if (!familyName) {
    res.status(400).json({error: 'Family Name Required'});
  }
  else if (!role) {
    res.status(400).json({error: 'Role Required'});
  }
  else {
    let emailExists = await dbModule.checkEmail(newUser.email);
    if (emailExists == false){
    res.status(200).json('New User Registered');

    await dbModule.insertUser(newUser);
    }
    else {
      res.status(400).json({error: 'Email Already Registered'});
    }
    }
}
catch (err) {
  next(err);
} 
});

router.post('/login', async (req,res,next) =>{
  //FIXME: check user's email and password and send response as json
  const email = req.body.email;
  const password = req.body.password;

  let foundUser = false;

  if (!email || !password){
    res.status(400).json({error: 'Please Enter Your Login Credentials'});
  }
else {
  const user = await dbModule.findUserByEmail(email);
  if (user.password == password){
  res.status(200).json(`Welcome Back! ${user._id}`);
  }
  else {
    res.status(400).json({error: 'Invalid login credential provided. Please try again.'})
  }
}});


router.put('/:userId', async (req,res,next) =>{
  //FIXME: update existing user and send response as json
  const userId = req.params.userId;
  const {email,password,givenName,familyName,role} = req.body;
  const user = await dbModule.findUserById(userId);
  const update = req.body;


  if(!user){
    res.status(404).json({error:'User Not Found'});
  }else {
    await dbModule.updateUser(userId, update);
    res.status(200).json(`User ${userId}  updated` );
  }

});

router.delete('/:userId', async (req,res,next) =>{
  //FIXME: delete user and send response as json
  const userId = req.params.userId;
  const user = await dbModule.findUserById(userId);
 if(!user) {
res.status(400).json({error: `User ${userId} not found.`});
 }
else {
  await dbModule.deleteUser(userId);
  res.status(200).json(`User ${userId} Deleted`)
}
});

//export router
export {router as userRouter};