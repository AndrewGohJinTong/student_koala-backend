import { NextFunction, Request, Response } from 'express';
import { Request as RequestAuth } from 'express-jwt';
import jwt_decode from 'jwt-decode';
import { getAuth0IDFromHeader } from '../helpers/accessControl';
import { convertToNum } from '../helpers/helpers';
import { IDeviceJWT } from '../interfaces/interfaces';
import * as deviceService from '../services/device.service';
import { hasRequiredDelegatedPermissions } from '../auth/permissionUtils';
import authConfig from '../authConfig';

export const getDevice = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const patientIDStr: string = req.params.patientID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await deviceService.getDevice(patientID, auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const provisionDevice = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const { patientID, cradleID, mouthguardID, nonce } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const patientIDNum = convertToNum(patientID, 'Invalid patient ID');
        const result = await deviceService.provisionDevice(patientIDNum, cradleID, mouthguardID, nonce, auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const deprovisionDevice = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const patientID: string = req.params.patientID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const patientIDNum = convertToNum(patientID, 'Invalid patient ID');
        await deviceService.deprovisionDevice(patientIDNum, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const authenticateDevice = async (req: Request, res: Response, next: NextFunction) => {
    const { cradleID, mouthguardID, devicePin } = req.body;

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const devicePinNum = convertToNum(devicePin, 'Invalid device ID or PIN');
        const result = await deviceService.authenticateDevice(cradleID, mouthguardID, devicePinNum);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const generateNonce = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await deviceService.generateNonce(auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const clearNonce = async (req: RequestAuth, res: Response, next: NextFunction) => {
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        await deviceService.clearNonce(auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const getLastLogin = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization!.split(' ')[1];
    const { cradleID, mouthguardID } = jwt_decode<IDeviceJWT>(token);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await deviceService.getLastLogin(cradleID, mouthguardID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getLastTransmission = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization!.split(' ')[1];
    const { cradleID, mouthguardID } = jwt_decode<IDeviceJWT>(token);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const result = await deviceService.getLastTransmission(cradleID, mouthguardID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};
