import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { extractBearerToken, getAuth0IDFromHeader } from '../helpers/accessControl';
import { convertToNum } from '../helpers/helpers';
import * as userService from '../services/user.service';
import { hasRequiredDelegatedPermissions } from '../auth/permissionUtils';
import authConfig from '../authConfig';

export const getPatientSelf = async (req: Request, res: Response, next: NextFunction) => {
    const patientID: string = req.params.userID;
    const requestedUserAuth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await userService.getSelfPatientProfile(patientID, "requestedUserAuth0ID");
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getPatient = async (req: Request, res: Response, next: NextFunction) => {
    const patientIDStr: string = req.params.userID;
    const requestedUserAuth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await userService.getPatientProfile(patientID, requestedUserAuth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getStaff = async (req: Request, res: Response, next: NextFunction) => {
    const userID: string = req.params.userID;
    const requestedUserAuth0ID = getAuth0IDFromHeader(req);

    try {        
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await userService.getStaffProfile(userID, requestedUserAuth0ID);
        res.send(result);
    } catch (err) {
        console.error(err);
        return next(err);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await userService.getAllUsers(auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const editUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userID, firstName, lastName, gender, birthday, phone, email, isActive } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const userIDNum = convertToNum(userID, 'Invalid user ID');
        await userService.editUser(userIDNum, firstName, lastName, gender, birthday, phone, email, isActive, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
    const userIDStr: string = req.params.userID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const userID = convertToNum(userIDStr, 'Invalid patient ID');
        await userService.deactivateUser(userID, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};
