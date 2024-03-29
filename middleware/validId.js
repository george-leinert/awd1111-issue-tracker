import { ObjectId } from 'mongodb';

const validId = (paramName) => {
  return (req, res, next) => {
    try {
      req[paramName] = new ObjectId(req.params[paramName]);
      return next();
    } catch (err) {
      return res.status(404).json({error: `Id was not a valid ObjectId.`});
    }
  }
}

export { validId };