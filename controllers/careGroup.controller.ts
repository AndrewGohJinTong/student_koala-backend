import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { getAuth0IDFromHeader } from '../helpers/accessControl';
import { convertToNum } from '../helpers/helpers';
import * as careGroupService from '../services/careGroup.service';
import { hasRequiredDelegatedPermissions } from '../auth/permissionUtils';
import authConfig from '../authConfig';

export const getAllCareGroups = async (req: Request, res: Response, next: NextFunction) => {
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await careGroupService.getAllCareGroups(auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getUsersCareGroups = async (req: Request, res: Response, next: NextFunction) => {
    const userIDStr: string = req.params.userID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const userID = convertToNum(userIDStr, 'Invalid user ID');
        const result = await careGroupService.getUsersCareGroups(auth0ID, userID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getUsersInCareGroup = async (req: Request, res: Response, next: NextFunction) => {
    const careGroupIDStr: string = req.params.careGroupID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const careGroupID = convertToNum(careGroupIDStr, 'Invalid care group ID');
        const result = await careGroupService.getUsersInCareGroup(auth0ID, careGroupID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const createCareGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { groupName } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        await careGroupService.createCareGroup(auth0ID, groupName);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const assignToCareGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { userID, careGroupID } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const userIDNum = convertToNum(userID, 'Invalid user ID');
        const careGroupIDNum = convertToNum(careGroupID, 'Invalid care group ID');
        await careGroupService.assignToCareGroup(auth0ID, userIDNum, careGroupIDNum);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const unassignFromCareGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { userID, careGroupID } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const userIDNum = convertToNum(userID, 'Invalid user ID');
        const careGroupIDNum = convertToNum(careGroupID, 'Invalid care group ID');
        await careGroupService.unassignFromCareGroup(auth0ID, userIDNum, careGroupIDNum);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};
