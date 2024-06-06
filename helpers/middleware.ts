import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { expressjwt, UnauthorizedError } from 'express-jwt';
import { unless } from 'express-unless';
import * as jwt from 'jsonwebtoken';
import { expressJwtSecret, GetVerificationKey } from 'jwks-rsa';
import { HttpException } from '../exceptions/HttpException';
import User from '../models/User';
import { getAuth0IDFromHeader } from './accessControl';

// Checks the validity of the JWT presented by the user who is currently trying to make a request
export const checkJWT = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH_URL}/.well-known/jwks.json`,
  }) as GetVerificationKey,
  audience: `${process.env.AUTH_AUDIENCE}`,
  issuer: `${process.env.AUTH_URL}/`,
  algorithms: ['RS256'],
});

// Checks the JWT presented by the user belongs to a staff member
export const checkAuthorised = () => {
  const middleware = async function (req: Request, res: Response, next: NextFunction) {
    console.log('[Server] Checking JWT belongs to a staff member');

    const authorizationHeader = req.headers && 'Authorization' in req.headers ? 'Authorization' : 'authorization';
    const token = req.headers[authorizationHeader] as string;

    if (!token) return res.status(403).send('No authentication token provided');

    const requestedUserAuth0ID = getAuth0IDFromHeader(req);
    const user = await User.findOne({ where: { auth0ID: requestedUserAuth0ID } });
    if (!user || user.role === 'patient') return res.status(403).send('You are not authorised to perform this action');

    next();
  };

  middleware.unless = unless;

  return middleware;
};

// Checks the validity of the JWT presented by the device trying to authenticate itself
export const checkDeviceJWT = (req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.headers && 'Authorization' in req.headers ? 'Authorization' : 'authorization';
  const token = req.headers[authorizationHeader] as string;

  if (!token) return res.status(403).send('No authentication token provided');

  const actualToken = token.split(' ')[1];

  try {
    jwt.verify(actualToken, process.env.JWT_SECRET!);
  } catch (err) {
    return res.status(401).send({ message: 'Invalid JWT' });
  }

  next();
};

// Custom error handler which makes use of the custom HttpException error class
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof HttpException || err instanceof UnauthorizedError) {
    res.status(err.status).send({ message: err.message });
  } else {
    res.status(500).send({ message: 'Internal server error' });
  }

  next();
};
