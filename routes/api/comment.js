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
import {isLoggedIn} from '../../middleware/isLoggedIn.js';
import {hasPermission} from '../../middleware/hasPermission.js';




const router = express.Router();

const newCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
});



router.get('/:bugId/comment/list', isLoggedIn(), validId('bugId'),  hasPermission('canViewData'), async (req,res,next) => {
  try {
    const bugId = req.bugId;
    const bug = await dbModule.findBugById(bugId);
    const comments = await dbModule.listAllComments(bug);
    res.json(comments);
    }
  catch(err){
    next(err)
  }
});

router.get('/:bugId/comment/:commentId', isLoggedIn(), validId('bugId'), validId('commentId'),  hasPermission('canViewData'), async (req,res,next) => {
  try {
    const commentId = req.commentId;
    const comment = await dbModule.findCommentById(commentId);
    res.json(comment);
    }
  catch(err){
    next(err)
  }
});

router.put('/:bugId/comment/new', isLoggedIn(), validId('bugId'), validBody(newCommentSchema), hasPermission('canAddComments'), async (req,res,next) => {
  try {
    const _id = dbModule.newId();
    const creationDate = new Date();
    const {text, author} = req.body;
    const bugId = req.bugId;
    const newComment = {
      _id, 
      text,
      creationDate,
      bugId
    }

    newComment.author =  {
      _id : req.auth._id,
      email : req.auth.email,
      fullName: req.auth.fullName,
      givenName: req.auth.givenName,
      familyName: req.auth.familyName
    }
  
  
  

      await dbModule.insertComment(newComment);
      res.status(200).json('New Comment Added');
  }
  catch (err) {
    next(err);
  } 

});


export {router as commentRouter};

