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


const router = express.Router();

const newCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
});



router.get('/:bugId/comment/list', validId('bugId'), async (req,res,next) => {
  try {
    if (!req.auth){
      return res.status('401').json({error: 'You must be logged in'});
    } else {


    const bugId = req.bugId;
    const bug = await dbModule.findBugById(bugId);
    const comments = await dbModule.listAllComments(bug);
    res.json(comments);
    }
  }
  catch(err){
    next(err)
  }
});

router.get('/:bugId/comment/:commentId', validId('bugId'), validId('commentId'), async (req,res,next) => {
  try {
    if (!req.auth){
      return res.status('401').json({error: 'You must be logged in'});
    } else {

    const commentId = req.commentId;
    const comment = await dbModule.findCommentById(commentId);
    res.json(comment);
    }
  }
  catch(err){
    next(err)
  }
});

router.put('/:bugId/comment/new', validId('bugId'), validBody(newCommentSchema), async (req,res,next) => {
  try {
    if (!req.auth){
      return res.status('401').json({error: 'You must be logged in'});
    } else {

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
  }
  catch (err) {
    next(err);
  } 

});


export {router as commentRouter};

