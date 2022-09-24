import debug from 'debug';
const debugMain = debug('app:routes:user');
import express from 'express';
import moment from 'moment';
import _ from 'lodash';
import { nanoid } from 'nanoid';

// FIXME: use this array to store bug data in for now
// we will replace this with a database in a later assignment
const bugsArray = [{
_id: 'iWrFl53m0H9BqVVt-6pji',
title: 'The entire App is broken', 
description: 'When I click the app it just spins',
stepsToReproduce: 'Click the app icon',
creationDate: new Date(),
},
{
_id: 'KJbDKHc2Z4hu-A7Yup2yH',
title: 'Doesn\'t support wide screen monitors', 
description: 'Layout is good on mobile but bad on desktop',
stepsToReproduce: 'View on any widescreen monitor',
creationDate: new Date(),
},
];

//create router
const router = express.Router();

//register routes
router.get('/list', (req,res,next) => {
  res.json(bugsArray);
});

router.get('/:bugId', (req,res,next) => {
  const bugId = req.params.bugId;
  //FIXME: get bug from bugsArray and send response as json
  const foundBug = bugsArray.find((bug) => bug._id == bugId);
  if (!foundBug){
    res.status(404).json({ error: `Bug ${bugId} Not Found`});
  }
  else {
    res.json(foundBug);
  }
});

router.put('/new', (req,res,next) => {
  //FixME: create new bug and send response as json
  const _id = nanoid();
  creationDate = new Date();
  const {title, description, stepsToReproduce} = req.body;

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
    const newBug = {
      _id, 
      title,
      description,
      stepsToReproduce,
      creationDate
    }
    res.status(200).json({text: 'New Bug Reported'})
  }


});

router.put('/:bugId', (req,res,next) => {
  //FixME: update existing bug and send response as json
  const bugId = req.params.bugId;
  const {title, description, stepsToReproduce} = req.body;
  const bug = bugsArray.find((bug) => bug._id == bugId);

  if(!bug){
    res.status(404).json({error:`Bug ${bugId} Not Found`});
  }else {
    if (title != undefined){
      bug.title = title;
    }
    if (description != undefined){
      bug.description = description;
    }
    if (stepsToReproduce != undefined){
      bug.stepsToReproduce = stepsToReproduce;
    }
    bug.lastUpdated = new Date();
    res.status(200).json({text: 'Bug Updated'});
  }

});
router.put('/:bugId/classify', (req,res,next) => {
  //FixME: classify bug and send response as json
  const bugId = req.params.bugId;
  const {classification} = req.body;
  const bug = bugsArray.find((bug) => bug._id == bugId);

  if(!classification){
    res.status(400).json({error: 'Classification is required'});
  }
  else if (!bug){
    res.status(404).json({error: `Bug ${bugId} not found`});
  }
  else {
  bug.classification = classification;
  bug.classifiedOn = new Date();
  bug.lastUpdated = new Date();
  res.status(200).json({text: 'Bug Classified'});
  }
});

router.put('/:bugId/assign', (req,res,next) => {
  //FixME: assign bug to a user and send response as json
  const bugId = req.params.bugId;
  const {assignedToUserId, assignedToUserName} = req.body;
  const bug = bugsArray.find((bug) => bug._id == bugId);

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
    bug.assignedToUserName = assignedToUserName;
    bug.assignedOn = new Date();
    bug.lastUpdated = new Date();

    res.status(200).json({text: 'Bug Assigned'});
  }
});
router.put('/:bugId/close', (req,res,next) => {
  //FixME: close bug and send response as json
  const bugId = req.params.bugId;
  const {closed} = req.body;
  const bug = bugsArray.find((bug) => bug._id == bugId);

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
  }

});

//export router
export {router as bugRouter};