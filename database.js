import { MongoClient, ObjectId, Db } from 'mongodb';
import config from 'config';
import debug from 'debug';
const debugDb = debug('app:database');
//const debug = require('debug')('app:database');

/** Generate/Parse an ObjectId */
const newId = (str) => ObjectId(str);

/** Global variable storing the open connection, do not use it directly. */
let _db = null;

/** Connect to the database */
async function connect() {
  if (!_db) {
    const dbUrl = config.get('db.url');
    const dbName = config.get('db.name');
    debugDb(dbUrl);
    debugDb(dbName);
    const client = await MongoClient.connect(dbUrl);
    _db = client.db(dbName);
    debugDb('Connected.');
  }
  return _db;
}

/** Connect to the database and verify the connection */
async function ping() {
  const db = await connect();
  await db.command({ ping: 1 });
  debugDb('Ping.');
}

// FIXME: add more functions here
async function listAllUsers() {
  const db = await connect();
  const users = await db.collection('user').find({}).toArray();
  return users;
}

async function findUserById(userId) {
  const db = await connect();
  const user = await db.collection('user').findOne({ _id: { $eq: userId } });
  return user;
}

async function insertUser(user) {
  const db = await connect();
  await db.collection('user').insertOne({
    ...user,
    creationDate: new Date(),
  });
}

async function checkEmail(newEmail) {
  const db = await connect();
  const foundEmail = await db.collection('user').findOne({email : {$eq: newEmail}});
  if (foundEmail){
    return true;
  }
  else {
    return false;
  }
}

async function findUserByEmail(userEmail) {
  const db = await connect();
  const user = await db.collection('user').findOne({ email : { $eq: userEmail } });
  return user;
}

async function updateUser(userId, update) {
  const db = await connect();
  await db.collection('user').updateOne(
    { _id: { $eq: userId } },
    {
      $set: {
        ...update,
        lastUpdated: new Date(),
      },
    }
  );
}

async function deleteUser(userId) {
  const db = await connect();
  await db.collection('user').deleteOne({ _id: { $eq: userId } });
}

async function listAllBugs() {
  const db = await connect();
  const bugs = await db.collection('bug').find({}).toArray();
  return bugs;
}

async function findBugById(bugId) {
  const db = await connect();
  const bug = await db.collection('bug').findOne({ _id: { $eq: bugId } });
  return bug;
}

async function insertBug(bug) {
  const db = await connect();
  await db.collection('bug').insertOne({
    ...bug,
    creationDate: new Date(),
  });
}

async function updateBug(bugId, updatedBug) {
  const db = await connect();
  await db.collection('bug').updateOne(
    { _id: { $eq: bugId } },
    {
      $set: {
        ...updatedBug,
        lastUpdated: new Date(),
      },
    }
  );
}

async function listAllComments(bug) {
  const db = await connect();
  const comments = await db.collection('comment').find({}).toArray();
  return comments;
}

async function findCommentById(commentId) {
  const db = await connect();
  const comment = await db.collection('comment').findOne({ _id: { $eq: commentId } });
  return comment;
}

async function insertComment(comment) {
  const db = await connect();
  await db.collection('comment').insertOne({
    ...comment,
    creationDate: new Date(),
  });
}

async function listAllTestCases(bug) {
  const db = await connect();
  const testCases = await db.collection('testCase').find({}).toArray();
  return testCases;
}

async function findTestCaseById(testCaseId) {
  const db = await connect();
  const testCase = await db.collection('testCase').findOne({ _id: { $eq: testCaseId } });
  return testCase;
}

async function insertTestCase(testCase) {
  const db = await connect();
  await db.collection('testCase').insertOne({
    ...testCase,
    creationDate: new Date(),
  });
}

async function updateTestCase(testId, updatedTest) {
  const db = await connect();
  await db.collection('testCase').updateOne(
    { _id: { $eq: testId } },
    {
      $set: {
        ...updatedTest,
        lastUpdated: new Date(),
      },
    }
  );
}

async function deleteTest(testId) {
  const db = await connect();
  debugDb(testId);
 const info = await db.collection('testCase').deleteOne({ _id: { $eq: testId } });
 debugDb(info);
}

async function saveEdit(edit) {
  const db = await connect();
  return await db.collection('edits').insertOne(edit);
}




// export functions
export {newId, ping, connect, listAllUsers, findUserById, insertUser, checkEmail, findUserByEmail, updateUser, deleteUser, listAllBugs, findBugById, insertBug, updateBug, listAllComments, findCommentById, insertComment, listAllTestCases, findTestCaseById, insertTestCase, updateTestCase, deleteTest, saveEdit}

// test the database connection
ping();

