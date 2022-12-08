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
import e from 'express';
import {isLoggedIn} from '../../middleware/isLoggedIn.js';
import {hasPermission} from '../../middleware/hasPermission.js';




const router = express.Router();

const newTestCaseSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  passed: Joi.bool().required(),
  author: Joi.string().trim().min(1).required()
});

const updateTestCaseSchema = Joi.object({
  title: Joi.string().trim().min(1),
  passed: Joi.bool(),
  author: Joi.string().trim().min(1)
});

router.get('/:bugId/test/list', isLoggedIn(), validId('bugId'), hasPermission('canViewData'), async (req,res,next) => {
  try {
    const bugId = req.bugId;
    const bug = await dbModule.findBugById(bugId);
    const testCases = await dbModule.listAllTestCases(bug);
    res.json(testCases);
    }
  catch(err){
    next(err)
  }
});

router.get('/:bugId/test/:testId', isLoggedIn(), validId('bugId'), validId('testId'), hasPermission('canViewData'), async (req,res,next) => {
  try {
    const testId = req.testId;
    const test = await dbModule.findTestCaseById(testId);
    res.json(test);
    }
  catch(err){
    next(err)
  }
});


router.put('/:bugId/test/new', isLoggedIn(), validId('bugId'), validBody(newTestCaseSchema), hasPermission('canAddTestCase'), async (req,res,next) => {
  try {
    const _id = dbModule.newId();
    const creationDate = new Date();
    const {title, passed, author} = req.body;
    const bugId = req.bugId;
    const newTestCase = {
      _id, 
      title,
      passed,
      author,
      creationDate,
      bugId
    };

    const testId = newTestCase._idl

    newTestCase.createdBy = {
      _id : req.auth._id,
      email : req.auth.email,
      fullName: req.auth.fullName,
      givenName: req.auth.givenName,
      familyName: req.auth.familyName
    }

    const edit = {
      timestamp: new Date(),
      op: 'insert',
      col: 'test',
      target: { testId },
      update: newTestCase,
      auth: req.auth, 
    };
    await dbModule.saveEdit(edit);
    debug('edit saved');

      await dbModule.insertTestCase(newTestCase);
      res.status(200).json('New Test Case Added');
      
    }
  catch (err) {
    next(err);
  } 

});


router.put('/:bugId/test/:testId', isLoggedIn(), validId('bugId'), validId('testId'), validBody(updateTestCaseSchema), hasPermission('canEditTestCase'), async (req,res,next) => {
  try {
    const bugId = req.bugId;
    const testId = req.testId;
    const test = await dbModule.findTestCaseById(testId);
    const update = req.body;

    update.createdBy = {
      _id : req.auth._id,
      email : req.auth.email,
      fullName: req.auth.fullName,
      givenName: req.auth.givenName,
      familyName: req.auth.familyName
    }

  
    if(!test){
      res.status(404).json({error:`Test Case ${testId} Not Found`});
    }else {
      await dbModule.updateTestCase(testId, update);
      res.status(200).json('Test Case Updated');

  
      const edit = {
        timestamp: new Date(),
        op: 'update',
        col: 'test',
        target: { testId },
        update: update,
        auth: req.auth, 
      };
      await dbModule.saveEdit(edit);
      debug('edit saved');
  
    }
  } catch(err) {
    next(err);
  }
});


router.put('/:bugId/test/:testId/execute', isLoggedIn(), validId('bugId'), validId('testId'), hasPermission('canExecuteTestCase'), async (req,res,next) => {
  try {
    const testId = req.testId;
    let random = await Math.floor(await Math.random() * 2);
    const test = await dbModule.findTestCaseById(testId);
    if (random === 0){
      test.passed = true;
    } else {
      test.passed = false;
    }
    await dbModule.updateTestCase(testId, test);
    res.status(200).json("Test Executed");
  } catch(err) {
    next(err);
  }

});


router.delete('/:bugId/test/:testId', isLoggedIn(), validId('bugId'), validId('testId'), hasPermission('canDeleteTestCase'), async (req,res,next) => {
  try {
      const testId = req.testId;
      const test = await dbModule.findTestCaseById(testId);
     if(!test) {
    res.status(400).json({error: `Test Case ${testId} not found.`});
     }
    else {
      await dbModule.deleteTest(testId);
      res.status(200).json(`Test Case ${testId} Deleted`)

      const edit = {
        timestamp: new Date(),
        op: 'delete',
        col: 'test',
        target: { testId },
        update: test,
        auth: req.auth, 
      };
      await saveEdit(edit);
      
    }
  } catch(err) {
    next(err);
  }

});


export {router as testRouter};
