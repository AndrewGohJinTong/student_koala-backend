import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { getAuth0IDFromHeader } from '../helpers/accessControl';
import { convertToNum, convertToNumOrNull } from '../helpers/helpers';
import { ISetting, ISettingReq } from '../interfaces/interfaces';
import * as treatmentService from '../services/treatment.service';
import { hasRequiredDelegatedPermissions } from '../auth/permissionUtils';
import authConfig from '../authConfig';

export const getAlertLevel = async (req: Request, res: Response, next: NextFunction) => {
    const patientIDStr: string = req.params.patientID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await treatmentService.getAlertLevel(patientID, auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const setAlertLevel = async (req: Request, res: Response, next: NextFunction) => {
    const { patientID, alertLevel } = req.body;

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const patientIDNum = convertToNum(patientID, 'Invalid patient ID');
        const alertLevelNum = convertToNum(alertLevel, 'Invalid alert level');
        await treatmentService.setAlertLevel(patientIDNum, alertLevelNum);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
    const patientIDStr: string = req.params.patientID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await treatmentService.getAlerts(patientID, auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const createAlert = async (req: Request, res: Response, next: NextFunction) => {
    const { patientID, alertName, description, alertLevel } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const patientIDNum = convertToNum(patientID, 'Invalid patient ID');
        await treatmentService.createAlert(patientIDNum, alertName, description, alertLevel, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction) => {
    const { alertID } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const alertIDNum = convertToNum(alertID, 'Invalid alert ID');
        await treatmentService.resolveAlert(alertIDNum, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const getClinicalNotes = async (req: Request, res: Response, next: NextFunction) => {
    const patientIDStr: string = req.params.patientID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await treatmentService.getClinicalNotes(patientID, auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const createClinicalNotes = async (req: Request, res: Response, next: NextFunction) => {
    const { patientID, clinicianID, description } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const patientIDNum = convertToNum(patientID, 'Invalid patient ID');
        const clinicianIDNum = convertToNum(clinicianID, 'Invalid patient ID');
        await treatmentService.createClinicalNotes(patientIDNum, clinicianIDNum, description, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const editClinicalNotes = async (req: Request, res: Response, next: NextFunction) => {
    const { noteID, description, isResolved } = req.body;
    console.log(1);
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const noteIDNum = convertToNum(noteID, 'Invalid note ID');
        await treatmentService.editClinicalNotes(noteIDNum, auth0ID, description, isResolved);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const deleteClinicalNotes = async (req: Request, res: Response, next: NextFunction) => {
    const noteIDStr: string = req.params.noteID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const noteID = convertToNum(noteIDStr, 'Invalid patient ID');
        await treatmentService.deleteClinicalNotes(noteID, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

export const getAllClinicianNotes = async (req: Request, res: Response, next: NextFunction) => {
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }

        const result = await treatmentService.getAllClinicianNotes(auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};



export const getAllClinicianAlerts = async (req: Request, res: Response, next: NextFunction) => {
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }

        const result = await treatmentService.getAllClinicianAlerts(auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
    const patientIDStr: string = req.params.patientID;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.read)) {
            throw new Error('User does not have the required permissions');
        }
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await treatmentService.getSettings(patientID, auth0ID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const getDefaultSettings = async (req: Request, res: Response, next: NextFunction) => {
    // Check if the user has the required permissions
    if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
        throw new Error('User does not have the required permissions');
    }
    const result = treatmentService.getDefaultSettings();
    res.send(result);
};

export const editSettings = async (req: Request, res: Response, next: NextFunction) => {
    const { settings } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);
    const settingsParsed: ISetting[] = [];

    for (const s of settings as ISettingReq[]) {
        const { patientID, settingID, settingName, primaryValue, secondaryValue, tertiaryValue, changeReason, unit } = s;

        try {
            const settingIDNum = convertToNum(settingID, 'Invalid setting ID');
            const primaryValueNum = convertToNum(primaryValue, 'Invalid data values');
            const secondaryValueNum = secondaryValue ? convertToNum(secondaryValue, 'Invalid data values') : 0;
            const tertiaryValueNum = tertiaryValue ? convertToNum(tertiaryValue, 'Invalid data values') : 0;

            settingsParsed.push({
                settingID: settingIDNum,
                patientID,
                settingName,
                primaryValue: primaryValueNum,
                secondaryValue: secondaryValueNum,
                tertiaryValue: tertiaryValueNum,
                changeReason,
                unit,
            });
        } catch (err) {
            return next(err);
        }
    }

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        await treatmentService.editSettings(settingsParsed, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};


export const getPatientThresholds  = async (req: Request, res: Response, next: NextFunction) => {
    const auth0ID = getAuth0IDFromHeader(req);
    const patientIDStr: string = req.params.userID;
    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        console.log(req.params);
        const patientID = convertToNum(patientIDStr, 'Invalid patient ID');
        const result = await treatmentService.getPatientThresholds(auth0ID, patientID);
        res.send(result);
    } catch (err) {
        return next(err);
    }
};

export const editPatientThreshold = async (req: Request, res: Response, next: NextFunction) => {
    const { measurement, lowerValue, upperValue, comments, patientID, isActive } = req.body;
    const auth0ID = getAuth0IDFromHeader(req);

    try {
        // Check if the user has the required permissions
        if (req.authInfo && !hasRequiredDelegatedPermissions(req.authInfo, authConfig.protectedRoutes.api.delegatedPermissions.write)) {
            throw new Error('User does not have the required permissions');
        }
        const lowerValueNum = convertToNumOrNull(lowerValue, 'Invalid lower threshold value');
        const upperValueNum = convertToNumOrNull(upperValue, 'Invalid upper threshold value');
        const patientIDNum = convertToNum(patientID, 'Invalid PatientID number');
        
        await treatmentService.editPatientThreshold(measurement, lowerValueNum, upperValueNum, comments, isActive, patientIDNum, auth0ID);
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};
