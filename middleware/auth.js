// import config from 'config';
// import jwt from 'jsonwebtoken';
// import debug from 'debug';

const authSecret = config.get('auth.secret');

import debug from 'debug';
import config from 'config';
import jwt from 'jsonwebtoken';


const auth = () => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const authCookie = req.cookies.authToken;

    if (authHeader) {
      debug('authHeader', authHeader);
      const [authType, authToken] = authHeader.split(' ', 2);
      if (authType === 'Bearer' && authToken) {
        try {
          req.auth = jwt.verify(authToken, authSecret);
        } catch (err) {
          debug('invalid token');
        }
      }
    } else if (authCookie) {
      debug('authCookie', authCookie);
      try {
        req.auth = jwt.verify(authCookie, authSecret);
        const cookieOptions = {
          httpOnly: true,
          maxAge: parseInt(config.get('auth.cookieMaxAge')),
        };
        res.cookie('authToken', authCookie, cookieOptions);
      } catch (err) {
        debug('invalid token');
      }
    }

    next();
  };
};

export {auth};