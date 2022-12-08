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
import {isLoggedIn} from '../../middleware/isLoggedIn.js';
import {hasPermission} from '../../middleware/hasPermission.js';





const newBugSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().min(1).required(),
  stepsToReproduce: Joi.string().trim().min(1).required(),
  authorOfBug: Joi.string().trim().min(1),
});

const updateBugSchema = Joi.object({
  title: Joi.string().trim().min(1),
  description: Joi.string().trim().min(1),
  stepsToReproduce: Joi.string().trim().min(1),
  authorOfBug: Joi.string().trim().min(1),
});

const classifyBugSchema = Joi.object({
  classification: Joi.string().trim().min(1).required()
});

const assignBugSchema = Joi.object({
  assignedToUserName: Joi.string().trim().min(1).required(),
  assignedToUserId: Joi.string().trim().length(24).required(),
});

const closeBugSchema = Joi.object({
  closed: Joi.bool().required()
})


//create router
const router = express.Router();

//register routes
router.get('/list', isLoggedIn(), hasPermission('canViewData'), async (req,res,next) => {
  try {

    let {keywords, classification, maxAge, minAge, open, closed, sortBy, pageSize, pageNumber } = req.query;

    maxAge = parseInt(maxAge);
    minAge = parseInt(minAge);

    const match = {};

    debugMain(closed);

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
    if (classification){
      match.classification = {$eq: classification};
    }

    if (!closed || closed == 'false') {
      match.closed = {$eq: false};
    }
    else if (closed == 'true') {
      match.closed = {$eq: true};
    }

    if (!open || open == 'true'){
      match.closed = {$eq: false};
    }
    else if (open == 'false') {
      match.closed = {$eq: true};
    }

    

    //sort stage

    let sort = {creationDate: 1};

    switch (sortBy) {
      case 'newest': sort = { creationDate: -1}; break;
      case 'oldest': sort = { creationDate: 1}; break;
      case 'title': sort = { title: 1, creationDate: -1}; break;
      case 'classification': sort = {classification: 1, creationDate: -1}; break;
      case 'assignedTo': sort = {assignedToUserName: 1, creationDate: -1}; break;
      case 'createdBy': sort = {authorOfBug: 1, creationDate: -1}; break;
    }

    const project = {title: 1, description: 1, stepsToReproduce: 1, creationDate: 1, classification: 1, classifiedOn: 1, closed: 1, assignedTo: 1, authorOfBug: 1, lastUpdated: 1};


    //skip and limit stages 

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
    const cursor = db.collection('bug').aggregate(pipeline);
    const results = await cursor.toArray();

    res.json(results);

  } catch (err) {
    next(err);
  }
});

router.get('/:bugId', isLoggedIn(), validId('bugId'), hasPermission('canViewData'),  async (req,res,next) => {
  try{ 



    const bugId = req.bugId;
    const bug = await dbModule.findBugById(bugId);
    if (!bug) {
      res.status(404).json({ error: `Bug ${bugId} not found` });
    } else {
      res.json(bug);
    }
  } catch (err) {
    next(err);
  }
});

router.put('/new', isLoggedIn(), validBody(newBugSchema), hasPermission('canCreateData'),  async (req,res,next) => {

  try {
  
    const _id = dbModule.newId();
    const creationDate = new Date();
    const {title, description, stepsToReproduce} = req.body;
    const newBug = {
      _id, 
      title,
      description,
      stepsToReproduce,
      creationDate,
      createdBy: ObjectId(req.auth._id)
    }

    const bugId = newBug._id
  
      const edit = {
        timestamp: new Date(),
        op: 'insert',
        col: 'bug',
        target: { bugId },
        update: newBug,
        auth: req.auth, 
      };
      await dbModule.saveEdit(edit);
      debug('edit saved');
  
      res.status(200).json('New Bug Reported');
      await dbModule.insertBug(newBug);
      
  
  }
  catch (err) {
    next(err);
  } 
});

router.put('/:bugId', isLoggedIn(), validId('bugId'), validBody(updateBugSchema), async (req,res,next) => {

  try {

  
  const bugId = await dbModule.newId(req.bugId);
  const bug = await dbModule.findBugById(bugId);
  const update = req.body;

  if (Object.keys(update).length > 0){
    update.lastUpdatedBy = {
      _id : req.auth._id,
      email : req.auth.email,
      fullName: req.auth.fullName,
      givenName: req.auth.givenName,
      familyName: req.auth.familyName
    }}
  

  if(!bug){
    res.status(404).json({error:`Bug ${bugId} Not Found`});
  }else {
    await dbModule.updateBug(bugId, update);
    res.status(200).json({text: 'Bug Updated'});

    const edit = {
      timestamp: new Date(),
      op: 'update',
      col: 'bug',
      target: { bugId },
      update: update,
      auth: req.auth, 
    };
    await dbModule.saveEdit(edit);
    debug('edit saved');

  }
  } catch (err) {
    next(err)
  }
});

router.put('/:bugId/classify', isLoggedIn(), validId('bugId'), validBody(classifyBugSchema), hasPermission('canClassifyAnyBug'), async (req,res,next) => {
  try {

  const bugId = await dbModule.newId(req.bugId);
  const classification = req.body.classification;
  const bug = await dbModule.findBugById(bugId);

  if (!bug){
    res.status(404).json({error: `Bug ${bugId} not found`});
  }
  else {
  bug.classification = classification;
  bug.classifiedOn = new Date();
  bug.classifiedBy = {
    _id : req.auth._id,
    email : req.auth.email,
    fullName: req.auth.fullName,
    givenName: req.auth.givenName,
    familyName: req.auth.familyName
  }



  await dbModule.updateBug(bugId, bug);

  res.status(200).json('Bug Classified');}

  const edit = {
    timestamp: new Date(),
    op: 'update',
    col: 'bug',
    target: { bugId },
    update: update,
    auth: req.auth, 
  };
  await dbModule.saveEdit(edit);
  debug('edit saved');
  } catch (err) {
    next(err);
  }
});

router.put('/:bugId/assign', isLoggedIn(), validId('bugId'), validId('assignedToUserId'), validBody(assignBugSchema), async (req,res,next) => {
  try {

  const bugId = await dbModule.newId(req.bugId);
  const {assignedToUserId, assignedToUserName} = req.body;
  const bug = await dbModule.findBugById(bugId);

  if(!bug){
    res.status(404).json({error: `Bug ${bugId} Not Found`});
  }
  else {
    bug.assignedToUserId = assignedToUserId;
    bug.assignedTo = assignedToUserName;
    const assignedTo = assignedToUserName;
    const assignedOn = new Date();
    bug.assignedBy = {
      _id : req.auth._id,
      email : req.auth.email,
      fullName: req.auth.fullName,
      givenName: req.auth.givenName,
      familyName: req.auth.familyName
    }


    await dbModule.updateBug(bugId, bug);
    const edit = {
      timestamp: new Date(),
      op: 'update',
      col: 'bug',
      target: { bugId },
      update: update,
      auth: req.auth, 
    };
    await dbModule.saveEdit(edit);
    debug('edit saved');
  

    res.status(200).json({text: 'Bug Assigned'});
  }}
  catch (err) {
    next(err);
  }
});

router.put('/:bugId/close', isLoggedIn(), validId('bugId'), validBody(closeBugSchema), hasPermission('canCloseAnyBug'), async (req,res,next) => {
  try {

  const bugId = req.bugId;
  const closed = req.closed;
  const bug = await dbModule.findBugById(bugId);


  if(!bug){
    res.status(404).json({error: `Bug ${bugId} not found`})
  }
  else{
    bug.closed = closed;
    bug.closedOn = new Date();
    bug.lastUpdated = new Date();
    bug.closedBy = {
      _id : req.auth._id,
      email : req.auth.email,
      fullName: req.auth.fullName,
      givenName: req.auth.givenName,
      familyName: req.auth.familyName
    }


    await dbModule.updateBug(bugId, bug);
    res.status(200).json('Bug closed');

    const edit = {
      timestamp: new Date(),
      op: 'update',
      col: 'bug',
      target: { bugId },
      update: update,
      auth: req.auth, 
    };
    await dbModule.saveEdit(edit);


  }
  } catch(err) {
    next(err);
  }
});

//export router
export {router as bugRouter};
