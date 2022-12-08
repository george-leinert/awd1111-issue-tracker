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
import { connect } from '../../database.js';
import bcrypt from 'bcrypt';
import config from 'config';
import jwt from 'jsonwebtoken';
import {isLoggedIn} from '../../middleware/isLoggedIn.js';
import {hasPermission} from '../../middleware/hasPermission.js';


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

function setAuthCookie(res, authToken) {
  const cookieOptions = {
    httpOnly: true,
    maxAge: parseInt(config.get('auth.cookieMaxAge')),
  };
  res.cookie('authToken', authToken, cookieOptions);
}


async function issueAuthToken(user) {
  const authPayload = {
    _id: user._id,
    email: user.email,
    givenName: user.givenName,
    role: user.role,
  };

  // get role names
  const roleNames = Array.isArray(user.role) ? user.role : [user.role];

  // get all of the roles in parallel
  const roles = await Promise.all(roleNames.map((roleName) => dbModule.findRoleByName(roleName)));

  // combine the permission tables
  const permissions = {};
  for (const role of roles) {
    if (role && role.permissions) {
      for (const permission in role.permissions) {
        if (role.permissions[permission] === true) {
          permissions[permission] = true;
        }
      }
    }
  }

  // update the token payload
  authPayload.permissions = permissions;

  // issue token
  const authSecret = config.get('auth.secret');
  const authOptions = { expiresIn: config.get('auth.tokenExpiresIn') };
  const authToken = jwt.sign(authPayload, authSecret, authOptions);
  return authToken;
}



//create router
const router = express.Router();

// router.put('/addthisrolebro', async (req,res,next) => {

//   const id = await dbModule.newId();

//   const role = {
//     _id: id,
//     name: "Business Analyst",
//     permissions: {
//       canEditUser: false,
//       canAssignRole: false, 
//       canViewData: true,
//       canCreateBug: true,
//       canEditAnyBug: true,
//       canCloseAnyBug: true,
//       canClassifyAnyBug: true,
//       canReassignAnyBug: true,
//       canEditAuthoredBug: true,
//       canEditAssignedBug: true, 
//       canReassignAssignedBug: true,
//       canAddComments: true,
//       canAddTestCase: false,
//       canEditTestCase: false,
//       canExecuteTestCase: false,
//       canDeleteTestCase: false
//     }
//   }
//   await dbModule.insertRole(role);

//   res.json('added gg');
// })


//find me 
//done
router.get('/me', async (req,res,next) =>{
  try{
    const user = await dbModule.findUserById(ObjectId(req.auth._id));
  
    const result = {
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      role: user.role,
      lastUpdated: user.lastUpdated,
      creationDate: user.creationDate
    }
    res.json(result);
    debugMain(user._id);
  
  } catch(err){
    next(err);
  }});

  //update logged in user
//done
router.put('/me', isLoggedIn(), validBody(updateUserSchema), async (req,res,next) =>{
  try {
    // if (!req.auth){
    //   return res.status('401').json({error: 'You must be logged in'});
    // } else {

    const userId = dbModule.newId(req.auth._id);

    const update = req.body;

    if (update.password){
      const saltRounds = parseInt(config.get('auth.saltRounds'));
      update.password = await bcrypt.hash(update.password, saltRounds);
      }
    if (Object.keys(update).length > 0) {
      update.lastUpdatedOn = new Date();
      update.lastUpdatedBy = {
        _id: req.auth._id,
        email: req.auth.email,
        fullName: req.auth.fullName,
        role: req.auth.role,
      };
    }

    const dbResult = await dbModule.updateUser(userId, update);

    const edit = {
      timestamp: new Date(),
      op: 'update',
      col: 'user',
      target: { userId },
      update,
      auth: req.auth, 
    };
    await dbModule.saveEdit(edit);
    debug('edit saved');

    res.json({message: 'User Updated!'});
  // }
  } catch (err) {
    next(err)
  }


});


//register routes
//done
router.get('/list', isLoggedIn(), hasPermission('canViewData'), async (req,res,next) => {
  try {
    let {keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber} = req.query;

    maxAge = parseInt(maxAge);
    minAge = parseInt(minAge);

    const match = {};


    const now = new Date();

    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);

    const pastMin = new Date(today);
    pastMin.setDate(pastMin.getDate() - minAge - 1);

    const pastMax = new Date(today);
    pastMax.setDate(pastMax.getDate() - maxAge);

    if (minAge && maxAge) {
      match.creationDate = { $lt: pastMin, $gte: pastMax };
    } else if (minAge) {
      match.creationDate = { $lt: pastMin} ;
    } else if (maxAge) {
      match.creationDate = { $gte: pastMax };
    }

    if (keywords){
      match.$text = { $search: keywords};
    }
    if (role){
      match.role = { $eq: role};
    }

    let sort = {givenName: 1};

    switch (sortBy) {
      case 'newest': sort = { creationDate: -1}; break;
      case 'oldest': sort = { creationDate: 1}; break;
      case 'givenName': sort = { givenName: 1, familyName: 1, creationDate: 1}; break;
      case 'role': sort = {role: 1,  givenName: 1, familyName: 1, creationDate: 1}; break;
    }


    const project = {email: 1, fullName: 1, givenName: 1, familyName: 1, role: 1, lastUpdated: 1, creationDate: 1};


    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 5;

    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
      {$match: match},
      {$sort: sort},
      {$project: project},
      {$skip: skip},
      {$limit: limit}
    ];

    const db = await connect();
    const cursor = db.collection('user').aggregate(pipeline);
    const results = await cursor.toArray();

    res.json(results);
  } catch (err) {
    next(err);
  }
});

//find user by id
//done
router.get('/:userId', isLoggedIn(), validId('userId'), hasPermission('canViewData'), async (req,res,next) => {
  try{ 
    const userId = req.userId;
    const user = await dbModule.findUserById(userId);
    if (!user) {
      res.status(404).json({ error: `User ${userId} not found` });
    } else {
      const result = {
        email: user.email,
        givenName: user.givenName,
        familyName: user.familyName,
        role: user.role,
        lastUpdated: user.lastUpdated,
        creationDate: user.creationDate
      }
      res.json(result);
    }
  } catch (err) {
    next(err);
  }

});

//register
//done
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

  
  newUser.password = await bcrypt.hash(newUser.password, 10);

    let emailExists = await dbModule.checkEmail(newUser.email);
    if (emailExists == false){

    await dbModule.insertUser(newUser);

    // const authPayload = {
    //   _id: newUser._id,
    //   email: newUser.email,
    //   fullName: newUser.fullName,
    //   givenName: newUser.givenName,
    //   familyName: newUser.familyName,
    //   role: newUser.role, 
    //   creationDate: newUser.creationDate
    // };
    // const authSecret = config.get('auth.secret');
    // const authOptions = { expiresIn: config.get('auth.tokenExpiresIn')};
    // const authToken = jwt.sign(authPayload, authSecret, authOptions);

    
    // const authMaxAge = parseInt(config.get('auth.cookieMaxAge'));
    // res.cookie('authToken', authToken, { maxAge: authMaxAge, httpOnly: true });

    const authToken = await issueAuthToken(newUser);
    setAuthCookie(res, authToken);
  

    const userId = newUser._id;

    const edit = {
      timestamp: new Date(),
      op: 'insert',
      col: 'user',
      target: { userId },
      update: newUser,
      auth: req.auth, 
    };
    await dbModule.saveEdit(edit);


    res.json({ message: 'User Registered!', userId, authToken });



    }
    else {
      res.status(400).json({error: 'Email Already Registered'});
    }
}
catch (err) {
  next(err);
} 
});

//login
//done
router.post('/login', validBody(loginSchema), async (req,res,next) =>{
  try {
  const email = req.body.email;
  const password = req.body.password;

  const user = await dbModule.findUserByEmail(email);

  if (user && await bcrypt.compare(password, user.password)) {
  // const authPayload = {
  //   _id: user._id,
  //   email: user.email,
  //   fullName: user.fullName,
  //   givenName: user.givenName,
  //   familyName: user.familyName,
  //   role: user.role, 
  //   creationDate: user.creationDate
  // };
  // const authSecret = config.get('auth.secret');
  // const authOptions = { expiresIn: config.get('auth.tokenExpiresIn')};
  // const authToken = jwt.sign(authPayload, authSecret, authOptions);

  
  // const authMaxAge = parseInt(config.get('auth.cookieMaxAge'));
  // res.cookie('authToken', authToken, { maxAge: authMaxAge, httpOnly: true });

  const authToken = await issueAuthToken(user);
  setAuthCookie(res, authToken);



  const userId = user._id;

  res.json({ message: 'Welcome Back!', 
  userId: user._id,
  token: authToken});

  }
  else {
    res.status(400).json({error: 'Invalid login credential provided. Please try again.'})
  }
} catch (err) {
  next(err);
}
});

//update user
//done
router.put('/:userId', isLoggedIn(), validId('userId'), hasPermission('canEditUser'), validBody(updateUserSchema), async (req,res,next) =>{
  try {

  const userId = req.userId;
  const user = await dbModule.findUserById(userId);
  const updatedUser = req.body;
  if (updatedUser.password){
    updatedUser.password = await bcrypt.hash(updatedUser.password, 10);
  }
if (Object.keys(updatedUser).length > 0){
  updatedUser.lastUpdatedBy = {
    _id : req.auth._id,
    email : req.auth.email,
    fullName: req.auth.fullName,
    givenName: req.auth.givenName,
    familyName: req.auth.familyName
  }}

  if(!user){
    res.status(404).json({error:'User Not Found'});
  }else {

    debugMain(updatedUser)
    await dbModule.updateUser(userId, updatedUser);
    res.status(200).json(`User ${userId}  updated` );

    const edit = {
      timestamp: new Date(),
      op: 'update',
      col: 'user',
      target: { userId },
      update: updatedUser,
      auth: req.auth, 
    };
    await dbModule.saveEdit(edit);



  }
  } catch(err) {
    next(err)
  }
});

//delete user
//done
router.delete('/:userId', isLoggedIn(), validId('userId'), hasPermission('canEditUser'), async (req,res,next) =>{
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

const edit = {
  timestamp: new Date(),
  op: 'delete',
  col: 'user',
  target: { userId },
  update: user,
  auth: req.auth, 
};
await saveEdit(edit);

  } catch (err) {
    next (err);
  }
});



//export router
export {router as userRouter};