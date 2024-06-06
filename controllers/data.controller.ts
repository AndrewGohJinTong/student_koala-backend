import { NextFunction, Request, Response } from 'express';
import { Request as RequestAuth } from 'express-jwt';
import jwt_decode from 'jwt-decode';
import { getAuth0IDFromHeader } from '../helpers/accessControl';
import { convertToNum } from '../helpers/helpers';
import { IDeviceJWT } from '../interfaces/interfaces';
import * as dataService from '../services/data.service';
import { hasRequiredDelegatedPermissions } from '../auth/permissionUtils';
import authConfig from '../authConfig';

export const getAllPatientData = async (req: RequestAuth, res: Response, next: NextFunction) => {
    console.log(req.body);
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await dataService.getAllPatientData(auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getPatientData = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const patientIDStr: string = req.params.patientID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await dataService.getPatientData(auth0ID, patientID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const receivePatientData = async (req: Request, res: Response, next: NextFunction) => {
    const { data } = req.body;
    const token = req.headers.authorization!.split(' ')[1];
    const { cradleID, mouthguardID } = jwt_decode<IDeviceJWT>(token);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        await dataService.receivePatientData(cradleID, mouthguardID, data);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};
