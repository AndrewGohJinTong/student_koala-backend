import { HttpException } from '../exceptions/HttpException';
import { checkSameCareGroup } from '../helpers/accessControl';
import { ISetting } from '../interfaces/interfaces';
import Alert from '../models/Alert';
import Clinician from '../models/Clinician';
import Note from '../models/Note';
import Patient from '../models/Patient';
import Setting from '../models/Setting';
import User from '../models/User';
import UserCareGroupRelation from '../models/UserCareGroupRelation';
import Threshold from '../models/Threshold';
import { Op } from 'sequelize';
// Note: The auth0ID parameter in these methods is the auth0ID of the user who triggered this operation
// It is retrieved from the decoded access token in the authorization header

export const getAlertLevel = async (patientID: number, auth0ID: string) => {
	console.log(`[Server] Getting alert level for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	return { alertLevel: patient.alertLevel };
};

export const getAlertLevelDevice = async (patientID: number) => {
	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	return { alertLevel: patient.alertLevel };
};

export const setAlertLevel = async (patientID: number, alertLevel: number) => {
	console.log(`[Server] Setting alert level to ${alertLevel} for patient ${patientID}`);

	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	await Patient.update({ alertLevel }, { where: { userID: patientID } });
};

export const getAlerts = async (patientID: number, auth0ID: string) => {
	console.log(`[Server] Getting alerts for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	const alerts = await Alert.findAll({ where: { patientID } });

	return { alerts };
};


export const createAlert = async (patientID: number, alertName: string, description: string, alertLevel: number, auth0ID: string = "") => {
    console.log(`[Server] Creating alert ${alertName} for patient ${patientID}`);

    let clinicianID = null; // Default to null unless a valid clinician is found

    if (auth0ID) {
        const clinician = await Clinician.findOne({
            include: [{
                model: User, 
                where: { auth0ID }
            }]
        });
        if (clinician) {
			clinicianID = clinician.userID;
        }
    }

    const patient = await Patient.findByPk(patientID);
    if (patient === null) {
        throw new HttpException(400, 'Patient not found');
    }

    await Alert.create({
        patientID,
        clinicianID, 
        alertName,
        description,
        alertLevel,
        isResolved: false
    });
};

export const resolveAlert = async (alertID: number, auth0ID: string) => {
	console.log(`[Server] Resolving alert ${alertID}`);

	const alert = await Alert.findByPk(alertID);
	if (alert === null) throw new HttpException(400, 'Alert not found');

	try {
		await checkSameCareGroup(auth0ID, alert.patientID);
	} catch (err) {
		throw err;
	}

	const clinician = await Clinician.findOne({ include: [{ model: User, where: { auth0ID } }] });
	if (!clinician) throw new HttpException(403, 'You are not authorised to resolve this alert');

	await Alert.update({ clinicianID: clinician.userID, alertLevel: 0, isResolved: true }, { where: { alertID } });

	// Check if the patietn still has other outstanding alerts and set the alert level accordingly
	const yellowAlerts = await Alert.count({ where: { patientID: alert.patientID, alertLevel: 1 } });
	const redAlerts = await Alert.count({ where: { patientID: alert.patientID, alertLevel: 2 } });

	if (redAlerts > 0) {
		await setAlertLevel(alert.patientID, 2);
	} else if (yellowAlerts > 0) {
		await setAlertLevel(alert.patientID, 1);
	} else {
		await setAlertLevel(alert.patientID, 0);
	}
};

export const getClinicalNotes = async (patientID: number, auth0ID: string) => {
	console.log(`[Server] Getting notes for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	const notes = await Note.findAll({
		where: { patientID },
		include: [
			{
				model: Clinician,
				attributes: { exclude: ['creationDate', 'updatedOn'] },
				include: [{ model: User, attributes: ['firstName', 'lastName'] }],
			},
		],
	});

	return { notes };
};

export const createClinicalNotes = async (
	patientID: number,
	clinicianID: number,
	description: string,
	auth0ID: string
) => {
	console.log(`[Server] Creating note for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	const clinician = await Clinician.findByPk(clinicianID, {});
	if (clinician === null) throw new HttpException(400, 'Clinician not found');
	try{
		await Note.create({ patientID, clinicianID, description, isResolved: false, });
	} catch (err) {
		throw err;
	}
};

export const editClinicalNotes = async (noteID: number,  auth0ID: string, description?: string, isResolved?: boolean) => {
    console.log(`[Server] Editing note ${noteID}`);

    const note = await Note.findByPk(noteID);
    if (note === null) throw new HttpException(400, 'Note not found');

    const currUser = await User.findOne({ where: { auth0ID } });
    if (!currUser) throw new HttpException(401, 'Invalid token');
    if (currUser.role !== 'admin' && note.clinicianID !== currUser.userID) {
        throw new HttpException(403, "You cannot edit another clinician's note");
    }

    try {
        await checkSameCareGroup(auth0ID, note.patientID);
    } catch (err) {
        throw err;
    }

    // Build the update object conditionally
    const updateData: Partial<Note> = {};
    if (description !== undefined) {
        updateData.description = description;
    }
    if (isResolved !== undefined) {
        updateData.isResolved = isResolved;
    }

    await Note.update(updateData, { where: { noteID } });
};

export const deleteClinicalNotes = async (noteID: number, auth0ID: string) => {
	console.log(`[Server] Deleting note ${noteID}`);

	const note = await Note.findByPk(noteID);
	if (note === null) throw new HttpException(400, 'Note not found');

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin' && note.clinicianID !== currUser.userID) {
		throw new HttpException(403, "You cannot delete another clinician's note");
	}

	try {
		await checkSameCareGroup(auth0ID, note.patientID);
	} catch (err) {
		throw err;
	}

	await Note.destroy({ where: {noteID} });

};

export const getAllClinicianNotes = async (auth0ID: string) => {
    console.log(`[Server] Getting all notes for user based on role`);

    const currUser = await User.findOne({ where: { auth0ID } });
    if (!currUser) throw new HttpException(401, 'Invalid token');

    try {
        let userIdsInCareGroups = [];

        if (currUser.role === 'admin') {
            // Admin can access notes from all users
            const allPatients = await Patient.findAll();
            userIdsInCareGroups = allPatients.map(patient => patient.userID);
        } else if (currUser.role === 'clinician') {
            // Clinicians can access notes only from users in their care groups
            const userCareGroups = await UserCareGroupRelation.findAll({
                where: { userID: currUser.userID }
            });

            const careGroupIDs = userCareGroups.map(ucg => ucg.careGroupID);

            const usersInCareGroups = await UserCareGroupRelation.findAll({
                where: { careGroupID: careGroupIDs }
            });

            userIdsInCareGroups = usersInCareGroups.map(ucg => ucg.userID);
        } else {
            // Optionally handle other roles, or throw an exception if not authorized
            throw new HttpException(403, 'Unauthorized access');
        }

        // Get notes where the patient associated with the note is part of the same care group or all patients for admins
        const notes = await Note.findAll({
            include: [{
                model: Patient,
                where: {
                    userID: userIdsInCareGroups
                },
                include: [{
                    model: User,
                    attributes: ['firstName', 'lastName']
                }],
            }],
        });

        return {notes};
    } catch (err) {
        throw err;
    }
}



export const getAllClinicianAlerts = async (auth0ID: string) => {
    console.log(`[Server] Getting all alerts for users based on role`);

    // Find current user
    const currUser = await User.findOne({ where: { auth0ID } });
    if (!currUser) throw new HttpException(401, 'Invalid token');

    try {
        let userIdsInCareGroups = [];

        if (currUser.role === 'admin') {
            // Admin can access alerts from all users
            const allUsers = await User.findAll();
            userIdsInCareGroups = allUsers.map(user => user.userID);
        } else if (currUser.role === 'clinician') {
            // Clinicians can access alerts only from users in their care groups
            const userCareGroups = await UserCareGroupRelation.findAll({
                where: { userID: currUser.userID }
            });

            const careGroupIDs = userCareGroups.map(ucg => ucg.careGroupID);

            const usersInCareGroups = await UserCareGroupRelation.findAll({
                where: { careGroupID: careGroupIDs }
            });

            userIdsInCareGroups = usersInCareGroups.map(ucg => ucg.userID);
        } else {
            // Optionally handle other roles, or throw an exception if not authorized
            throw new HttpException(403, 'Unauthorized access');
        }

        // Get alerts where the patient associated with the alert is part of the same care group or all users for admins
        const alerts = await Alert.findAll({
            include: [{
                model: Patient,
                where: {
                    userID: userIdsInCareGroups
                },
                include: [{
                    model: User,
                    attributes: ['firstName', 'lastName']
                }],
            }]
        });

        return alerts;
    } catch (err) {
        throw err;
    }
}



export const getSettings = async (patientID: number, auth0ID: string) => {
	console.log(`[Server] Getting settings for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const settings = await Setting.findAll({
		where: { patientID },
		attributes: { exclude: ['creationDate', 'updatedOn'] },
	});

	if (settings.length === 0) throw new HttpException(400, 'Settings for patient not found');

	return { settings };
};

export const editSettings = async (newSettings: ISetting[], auth0ID: string) => {
	if (newSettings.length === 0) return;

	const patientID = newSettings.at(0)?.patientID!;
	console.log(`[Server] Editing settings for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	const promises = newSettings.map((newSetting) =>
		Setting.update(newSetting, { where: { settingID: newSetting.settingID } })
	);

	await Promise.all(promises);
};

export const getDefaultSettings = () => {
	const defaults: ISetting[] = [
		{
			settingName: 'usage',
			primaryValue: 8, // How many hours the device was used
			changeReason: '',
			unit: ' hour(s)',
		},
		{
			settingName: 'ahi',
			primaryValue: 15, // Moderate AHI
			secondaryValue: 30, // Severe AHI
			changeReason: '',
			unit: ' event(s)/hour',
		},
		{
			settingName: 'spo2',
			primaryValue: 90, // Moderate SpO2 level
			secondaryValue: 80, // Severe SpO2 level
			changeReason: '',
			unit: '%',
		},
		{
			settingName: 'temp',
			primaryValue: 37, // Moderately high temperature
			secondaryValue: 39, // Severely high temperature
			changeReason: '',
			unit: '°C',
		},
		{
			settingName: 'tilt',
			primaryValue: 360, // ???
			secondaryValue: 360,
			changeReason: '',
			unit: '°',
		},
	];

	return { settings: defaults };
};

export const createDefaultSettings = async (patientID: number) => {
	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	const defaults = getDefaultSettings();
	const defaultsWithID = defaults.settings.map((setting) => ({ ...setting, patientID }));

	await Setting.bulkCreate(defaultsWithID);
};

export const getPatientThresholds = async(auth0ID: string, patientID: number) => {
	console.log(`[Server] Getting all thresholds for Patient ${patientID}`);

    // // Find current user
    const currUser = await User.findOne({ where: { auth0ID } });
    if (!currUser) throw new HttpException(401, 'Invalid token');

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const thresholds = await Threshold.findAll({
		where: { patientID },
	});
	return thresholds;
}

export const editPatientThreshold = async(measurement: string, lowerValue: number | null, upperValue: number | null, comments: string, isActive: boolean, patientID: number, auth0ID: string) => {
	console.log(`[Server] editing thresholds for ${patientID}`);

    // // Find current user
    const currUser = await User.findOne({ where: { auth0ID } });
    if (!currUser) throw new HttpException(401, 'Invalid token');

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}
	// Allowed measurement types
	const allowedMeasurements = ['usage', 'ahi', 'spo2', 'temp', 'tilt'];

	// Check if the measurement is valid
	if (!allowedMeasurements.includes(measurement)) {
		throw new HttpException(400, 'Invalid measurement type');
	}

    // Find the existing threshold
    const existingThreshold = await Threshold.findOne({
        where: {
            patientID,
            measurement
        }
    });

    if (!existingThreshold) {
        throw new HttpException(404, 'Threshold not found');
    }

    // // Update threshold based on the type specified
	existingThreshold.lowerValue = lowerValue;
	existingThreshold.upperValue = upperValue;
	existingThreshold.comments = comments;
	existingThreshold.active = isActive;
    // Save the updated threshold
    await existingThreshold.save();
}
