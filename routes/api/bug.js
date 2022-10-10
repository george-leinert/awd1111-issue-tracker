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



// FIXME: use this array to store bug data in for now
// we will replace this with a database in a later assignment
// const bugsArray = [{
// _id: 'iWrFl53m0H9BqVVt-6pji',
// title: 'The entire App is broken', 
// description: 'When I click the app it just spins',
// stepsToReproduce: 'Click the app icon',
// creationDate: new Date(),
// },
// {
// _id: 'KJbDKHc2Z4hu-A7Yup2yH',
// title: 'Doesn\'t support wide screen monitors', 
// description: 'Layout is good on mobile but bad on desktop',
// stepsToReproduce: 'View on any widescreen monitor',
// creationDate: new Date(),
// },
// ];




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
router.get('/list', async (req,res,next) => {
  try {
    const bugs = await dbModule.listAllBugs();
    res.json(bugs);
  } catch (err) {
    next(err);
  }
});

router.get('/:bugId', validId('bugId'),  async (req,res,next) => {
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

router.put('/new', validBody(newBugSchema), async (req,res,next) => {
  //FixME: create new bug and send response as json

  try {
    const _id = dbModule.newId();
    const creationDate = new Date();
    const {title, description, stepsToReproduce} = req.body;
    const newBug = {
      _id, 
      title,
      description,
      stepsToReproduce,
      creationDate
    }
  
    // if (!title){
    //   res.status(400).json({error: 'Title Required'});
    // }
    // else if (!description) {
    //   res.status(400).json({error: 'Description Required'});
    // }
    // else if (!stepsToReproduce) {
    //   res.status(400).json({error: 'Steps To Reproduce Required'});
    // }
    // else {
      res.status(200).json('New Bug Reported');
      await dbModule.insertBug(newBug);
      
      // }
  }
  catch (err) {
    next(err);
  } 
});

router.put('/:bugId', validId('bugId'), validBody(updateBugSchema), async (req,res,next) => {
  //FixME: update existing bug and send response as json

  try {
  const bugId = await dbModule.newId(req.bugId);
  // const {title, description, stepsToReproduce} = req.body;
  const bug = await dbModule.findBugById(bugId);
  const update = req.body;

  if(!bug){
    res.status(404).json({error:`Bug ${bugId} Not Found`});
  }else {
    await dbModule.updateBug(bugId, update);
    res.status(200).json({text: 'Bug Updated'});
  }
  } catch (err) {
    next(err)
  }
});

router.put('/:bugId/classify', validId('bugId'), validBody(classifyBugSchema), async (req,res,next) => {
  //FixME: classify bug and send response as json
  try {
  const bugId = await dbModule.newId(req.bugId);
  const classification = req.body.classification;
  const bug = await dbModule.findBugById(bugId);

  // if(!classification){
  //   res.status(400).json({error: 'Classification is required'});
  // }
   if (!bug){
    res.status(404).json({error: `Bug ${bugId} not found`});
  }
  else {
  bug.classification = classification;
  bug.classifiedOn = new Date();


  await dbModule.updateBug(bugId, bug);
  // await dbModule.updateBug(bugId, classifiedOn);

  res.status(200).json('Bug Classified');
  }} catch (err) {
    next(err);
  }
});

router.put('/:bugId/assign', validId('bugId'), validId('assignedToUserId'), validBody(assignBugSchema), async (req,res,next) => {
  //FixME: assign bug to a user and send response as json
  try {
  const bugId = await dbModule.newId(req.bugId);
  const {assignedToUserId, assignedToUserName} = req.body;
  const bug = await dbModule.findBugById(bugId);

  // if(!assignedToUserId){
  //   res.status(400).json({error: 'Assigned To User Id Is Required'});
  // }
  // else if(!assignedToUserName){
  //   res.status(400).json({error: 'Assigned To User Name Is Required'});
  // }
  if(!bug){
    res.status(404).json({error: `Bug ${bugId} Not Found`});
  }
  else {
    bug.assignedToUserId = assignedToUserId;
    bug.assignedTo = assignedToUserName;
    const assignedTo = assignedToUserName;
    const assignedOn = new Date();
    // bug.lastUpdated = new Date();

    await dbModule.updateBug(bugId, bug);
    //await dbModule.updateBug(bugId, assignedTo);


    res.status(200).json({text: 'Bug Assigned'});
  }}
  catch (err) {
    next(err);
  }
});

router.put('/:bugId/close', validId('bugId'), validBody(closeBugSchema), async (req,res,next) => {
  //FixME: close bug and send response as json
  try {
  const bugId = req.bugId;
  const closed = req.closed;
  const bug = await dbModule.findBugById(bugId);


  // if(!closed){
  //   res.status(400).json({error: 'Closed Is Required'})
  // }
  if(!bug){
    res.status(404).json({error: `Bug ${bugId} not found`})
  }
  else{
    bug.closed = closed;
    bug.closedOn = new Date();
    bug.lastUpdated = new Date();

    await dbModule.updateBug(bugId, bug);
    res.status(200).json('Bug closed');

  }
  } catch(err) {
    next(err);
  }
});

//export router
export {router as bugRouter};
