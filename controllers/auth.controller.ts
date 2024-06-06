import { NextFunction, Request, Response } from 'express';
import { Request as RequestAuth } from 'express-jwt';
import { getAuth0IDFromHeader } from '../helpers/accessControl';
import * as authService from '../services/auth.service';
import { hasRequiredDelegatedPermissions } from '../auth/permissionUtils';
import authConfig from '../authConfig';

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { authorizationCode } = req.body;

    try {
        const result = await authService.login(authorizationCode);
        res.send(result);
    } catch (err) {
        next(err);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.logout(req.headers.authorization);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
};

// No longer needed, as this is done in the Azure Portal
export const register = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const { firstName, lastName, gender, birthday, role, phone, email, password } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const generatedID = await authService.register(
            auth0ID,
            firstName,
            lastName,
            gender,
            birthday,
            role,
            phone,
            email,
            password
        );
        res.send({ userID: generatedID });
    } catch (err) {
        next(err);
    }
};

export const changePassword = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const auth0ID = getAuth0IDFromHeader(req);

    try {
        await authService.changePassword(auth0ID, email);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
};
