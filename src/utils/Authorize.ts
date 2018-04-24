import * as express from 'express';
import ServiceResponse from './ServiceResponse';
import { verifyToken } from '../services/AuthenticationService';

interface IASRequest extends express.Request {
  authorization: {
    userId: number
  }
}


export function authorize(req: IASRequest, res: express.Response, next: express.NextFunction) {
  let token = req.headers['authorization'];
  if (!token || !token.toString().startsWith('Bearer ')) {
    return res.status(401).json(new ServiceResponse(null, 'Unauthorized'));
  } else {
    try {
      req.authorization = {
        userId: verifyToken(token.slice(7).toString()).userId
      }
      return next();
    } catch(e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }
  }

}