import debug from 'debug';
const debugMain = debug('app:routes:user');
import express from 'express';
import moment from 'moment';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import * as dbModule from '../../database.js';


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

router.get('/:bugId', async (req,res,next) => {
  try{ 
    const bugId = dbModule.newId(req.params.bugId);
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

router.put('/new', async (req,res,next) => {
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
  
    if (!title){
      res.status(400).json({error: 'Title Required'});
    }
    else if (!description) {
      res.status(400).json({error: 'Description Required'});
    }
    else if (!stepsToReproduce) {
      res.status(400).json({error: 'Steps To Reproduce Required'});
    }
    else {
      res.status(200).json('New Bug Reported');
      await dbModule.insertBug(newBug);
      
      }
  }
  catch (err) {
    next(err);
  } 
});

router.put('/:bugId', async (req,res,next) => {
  //FixME: update existing bug and send response as json

  try {
  const bugId = await dbModule.newId(req.params.bugId);
  const {title, description, stepsToReproduce} = req.body;
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

router.put('/:bugId/classify', async (req,res,next) => {
  //FixME: classify bug and send response as json
  try {
  const bugId = await dbModule.newId(req.params.bugId);
  const classification = req.body;
  const bug = await dbModule.findBugById(bugId);

  if(!classification){
    res.status(400).json({error: 'Classification is required'});
  }
  else if (!bug){
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

router.put('/:bugId/assign', async (req,res,next) => {
  //FixME: assign bug to a user and send response as json
  try {
  const bugId = await dbModule.newId(req.params.bugId);
  const {assignedToUserId, assignedToUserName} = req.body;
  const bug = await dbModule.findBugById(bugId);

  if(!assignedToUserId){
    res.status(400).json({error: 'Assigned To User Id Is Required'});
  }
  else if(!assignedToUserName){
    res.status(400).json({error: 'Assigned To User Name Is Required'});
  }
  else if(!bug){
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
router.put('/:bugId/close', async (req,res,next) => {
  //FixME: close bug and send response as json
  try {
  const bugId = await dbModule.newId(req.params.bugId);
  const closed = req.body;
  const bug = await dbModule.findBugById(bugId);


  if(!closed){
    res.status(400).json({error: 'Closed Is Required'})
  }
  else if(!bug){
    res.status(404).json({error: `Bug ${bugId} not found`})
  }
  else{
    bug.closed = closed;
    bug.closedOn = new Date();
    bug.lastUpdated = new Date();

    await dbModule.updateBug(bugId, bug);
  }
  } catch(err) {
    next(err);
  }
});

//export router
export {router as bugRouter};
