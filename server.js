//const config = require('config');
//const database = require('./database');
import config from 'config';
import {connect} from './database.js';
import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import debug from 'debug';
const debugMain = debug('app:server');
const debugError = debug('app:error');
import cookieParser from 'cookie-parser';
import * as path from 'path';
import {bugRouter} from './routes/api/bug.js';
import {userRouter} from './routes/api/user.js';


//create application
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());

//register routes
app.use('/api/user', userRouter);
app.use('/api/bug', bugRouter);
app.use('/', express.static('public', {index: 'index.html'}));


// register error handlers
app.use((req, res, next) => {
  debugError(`Sorry couldn't find ${req.originalUrl}`);
  res.status(404)
    .json({error: `Sorry couldn't find ${req.originalUrl}`});
});
app.use((err, req, res, next) => {
  debugError(err);
  res.status(err.status || 500)
    .json({error: err.message });
});

//listen for requests

//const hostname = process.env.HOSTNAME || 'localhost';
//const port = process.env.PORT || 5000;
const hostname = config.get('http.host');
const port = config.get('http.port');

app.listen(port, () => {
  debugMain(`Server running at http://${hostname}:${port}`);
});

