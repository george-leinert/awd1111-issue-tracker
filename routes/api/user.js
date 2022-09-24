import debug from 'debug';
const debugMain = debug('app:routes:user');
import express from 'express';
import moment from 'moment';
import _ from 'lodash';
import { nanoid } from 'nanoid';

//FIXME: use this array to store user data in for now
//we will replace this with a database later
const usersArray = [{
  _id:'0GVgJWVlwh1v4gAgN-3yP',
  email: 'spencershay@icarly.com',
  password: '123456',
  fullName: 'Spencer Shay',
  givenName: 'Spencer',
  familyName: 'Shay',
  role: 'Developer'
}, {
  _id: 'Svb98CO18IPLG5Qnyey_1',
  email: 'carlyshay@icarly.com',
  password: '123456',
  fullName: 'Carly Shay',
  givenName: 'Carly',
  familyName: 'Shay',
  role: 'Quality Analyst'
}
];

//create router
const router = express.Router();

//register routes
router.get('/list', (req,res,next) => {
  res.json(usersArray);
});

router.get('/:userId', (req,res,next) => {
  const userId = req.params.userId;
  //FIXME: get user from usersArray and send response as json
  const foundUser = usersArray.find((user) => user._id == userId);
  if (!foundUser){
    res.status(404).json({ error: 'User Not Found'});
  }
  else {
    res.json(foundUser);
  }
});

router.post('/register', (req,res,next) =>{
  //FIXME: register new user and send response as json
  const _id = nanoid();
  const {email,password,givenName,familyName,role} = req.body;
  const fullName = givenName + ' ' + familyName;

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
    let emailFound = false;
    for (let index = 0; index < usersArray.length; index++) {
      if (email == usersArray[index].email)
      {res.status(400).json({error: 'Email already registered'});
      emailFound = true;}
    }
    if(emailFound == false){
      res.status(200).json({text: 'New User Registered'});
    }
  }
});

router.post('/login', (req,res,next) =>{
  //FIXME: check user's email and password and send response as json
  const email = req.body.email;
  const password = req.body.password;

  let foundUser = false;

  if (!email || !password){
    res.status(400).json({error: 'Please Enter Your Login Credentials'});
  }
else {
  for (let index = 0; index < usersArray.length; index++) {
    if(usersArray[index].email == email && usersArray[index].password == password){
      res.json(usersArray[index]);
      foundUser= true;
    }
  }
if (!foundUser){
  res.status(404).json({error:'Invalid Login Credential provided. Please Try Again'});
}
else if (foundUser = true){
  res.status(200).json('Welcome Back');
}
}});


router.put('/:userId', (req,res,next) =>{
  //FIXME: update existing user and send response as json
  const userId = req.params.userId;
  const {email,password,givenName,familyName,role} = req.body;
  const user = usersArray.find((user) => user._id == userId);

  if(!user){
    res.status(404).json({error:'User Not Found'});
  }else {
    if (email != undefined){
      user.email = email;
    }
    if (password != undefined){
      user.password = password;
    }
    if (givenName != undefined){
      user.givenName = givenName;
    }
    if (familyName != undefined){
      user.familyName = familyName;
    }
    if (familyName != undefined && givenName != undefined){
      user.fullName = givenName + ' ' + familyName;
    }
    if (role != undefined){
      user.role = role;
    }
    user.lastUpdated = new Date();
    res.status(200).json('User Updated');
    
  }

});

router.delete('/:userId', (req,res,next) =>{
  //FIXME: delete user and send response as json
  const userId = req.params.userId;
  const index = usersArray.findIndex((user) => user._id == userId);
  if (index < 0){
    res.status(404).json({error: `User ${userId} Not Found`});
  } else {
    usersArray.splice(index, 1);
    res.json({ message: 'User Deleted!'});
  }
});

//export router
export {router as userRouter};