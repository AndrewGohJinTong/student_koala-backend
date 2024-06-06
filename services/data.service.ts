import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import { HttpException } from '../exceptions/HttpException';
import { checkSameCareGroup } from '../helpers/accessControl';
import { getSummary } from '../helpers/averages';
import { IDataParsed, IDataRaw, IDataSummary } from '../interfaces/interfaces';
import Device from '../models/Device';
import DeviceData from '../models/DeviceData';
import Patient from '../models/Patient';
import Setting from '../models/Setting';
import User from '../models/User';
import UserCareGroupRelation from '../models/UserCareGroupRelation';
import { createAlert, getAlertLevelDevice, setAlertLevel } from './treatment.service';

// Note: The auth0ID parameter in these methods is the auth0ID of the user who triggered this operation
// It is retrieved from the decoded access token in the authorization header

export const getAllPatientData = async (auth0ID: string) => {
	console.log(`[Server] Getting all patients' data`);
	console.log(auth0ID);

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	console.log(currUser);

	const currUserCareGroups = await UserCareGroupRelation.findAll(
		currUser.role === 'admin' ? {} : { where: { userID: currUser.userID } }
	);
	console.log(currUserCareGroups);

	const currUserGroupIDs = currUserCareGroups.map((relation) => relation.careGroupID);
	const patientsInCareGroup = await UserCareGroupRelation.findAll({
		where: { careGroupID: currUserGroupIDs },
		include: [{ model: User, where: { role: 'patient' } }],
	});
	const patientsInCareGroupIDs = patientsInCareGroup.map((relation) => relation.userID);

	const today = DateTime.now().minus({ months: 1 }).startOf('day');
	const result = await DeviceData.findAll({
		where: { patientID: patientsInCareGroupIDs, start: { [Op.gte]: today.toJSDate() } },
	});

	const summary: IDataSummary[] = [];
	for (const patient of patientsInCareGroup) {
		const patientData = result.filter((res) => res.patientID === patient.userID);
		summary.push(await getSummary(patient.userData, patientData));
	}

	return summary;
};

export const getPatientData = async (auth0ID: string, patientID: number) => {
	console.log(`[Server] Getting all patient data for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const patient = await Patient.findByPk(patientID);
	if (patient === null) throw new HttpException(400, 'Patient not found');

	const result = await DeviceData.findAll({
		where: { patientID },
		attributes: { exclude: ['creationDate', 'updatedOn'] },
	});

	return { result };
};

export const receivePatientData = async (cradleIdJWT: number, mouthguardIdJWT: number, data: IDataRaw) => {
	console.log(`[Server] Receiving data at ${Date.now().toString()}`);

	const parsedData: IDataParsed[] = [];

	const { cradleID, mouthguardID, batteryLevel, batteryHealth, timeStamp } = data.metadata;
	const device = await Device.findOne({ where: { cradleID, mouthguardID } });

	if (device === null) throw new HttpException(400, 'Device not found');
	if (cradleID !== cradleIdJWT || mouthguardID !== mouthguardIdJWT) {
		throw new HttpException(403, 'Device ID mismatch');
	}

	try {
		await Device.update(
			{ batteryHealth, batteryLevel, lastTransmission: new Date() },
			{ where: { cradleID, mouthguardID } }
		);
	} catch (err) {
		throw new HttpException(400, 'Invalid device metadata');
	}

	const patientID = device.patientID;
	const patientSettings = await Setting.findAll({ where: { patientID } });

	for (const [measurement, value] of Object.entries(data)) {
		if (measurement === 'metadata') continue;

		const setting = patientSettings.find((s) => s.settingName === measurement);
		if (!setting) throw new HttpException(400, 'Invalid measurement');

		try {
			parsedData.push(await parseData(patientID, measurement, setting, value, timeStamp));
		} catch (err) {
			if (err instanceof HttpException) {
				throw err;
			} else {
				throw new HttpException(400, 'Invalid data');
			}
		}
	}

	await DeviceData.bulkCreate(parsedData as any[]);
};

const parseData = async (
	patientID: number,
	measurement: string,
	setting: Setting,
	data: any[] | number,
	timeStamp: number
) => {
	if (typeof data === 'number') {
		return {
			patientID,
			measurement,
			start: new Date(timeStamp * 1000),
			end: new Date(timeStamp * 1000),
			sampleRate: 0,
			dataPoints: data.toString(),
		};
	}

	const [startOffset, endOffset, sampleRate] = data.shift();
	if (startOffset < 0 || endOffset < 0 || endOffset < startOffset) {
		throw new HttpException(400, 'Invalid start/end time');
	}

	if (sampleRate < 0) throw new HttpException(400, 'Invalid sample rate');
	if (!data.length) throw new HttpException(400, 'Missing data');

	const timeStampDate = new Date(timeStamp * 1000);
	if (isNaN(timeStampDate.getTime())) throw new HttpException(400, 'Invalid time stamp');

	let { alertLevel } = await getAlertLevelDevice(patientID);

	if (measurement === 'usage') {
		alertLevel = Math.max(alertLevel, checkUsage(patientID, data, setting));
	} else {
		alertLevel = Math.max(alertLevel, checkLimits(patientID, measurement, data, setting));
	}
	setAlertLevel(patientID, alertLevel);

	try {
		const start = new Date(timeStampDate.getTime() + 1000 * startOffset);
		const end = new Date(timeStampDate.getTime() + 1000 * endOffset);

		return { patientID, measurement, start, end, sampleRate, dataPoints: JSON.stringify(data) } as IDataParsed;
	} catch (err) {
		throw new HttpException(400, `Invalid ${measurement} start/end time`);
	}
};

// Check if usage measurement is within acceptable thresholds
const checkUsage = (patientID: number, data: any[], usageSetting: Setting) => {
	for (const dataPoint of data) {
		if (dataPoint < usageSetting.primaryValue) {
			createAlert(patientID, 'usage', `Usage less than ${usageSetting.primaryValue} hours`, 1);
		}

		return 1;
	}

	return 0;
};

// Check if measurements other than usage are within acceptable thresholds
const checkLimits = (patientID: number, measurement: string, data: any[], setting: Setting) => {
	const moderate = setting.primaryValue; // The value to trigger a moderate alert
	const severe = setting.secondaryValue; // The value to trigger a severe alert

	let currAlertLevel = 0;
	let worstResult = data[0];

	// SpO2 needs to be treated differently because we usually want SpO2 to be above a certain value
	for (const dataPoint of data) {
		if (dataPoint >= moderate) {
			worstResult = measurement === 'spo2' ? Math.min(worstResult, dataPoint) : Math.max(worstResult, dataPoint);
		}

		if (moderate <= dataPoint && dataPoint <= severe) {
			currAlertLevel = Math.max(currAlertLevel, 1);
		} else if (measurement === 'spo2' ? dataPoint < severe : dataPoint > severe) {
			currAlertLevel = Math.max(currAlertLevel, 2);
		}
	}

	if (currAlertLevel === 1) {
		const message = measurement === 'spo2' ? `${severe} and ${moderate}` : `${moderate} and ${severe}`;
		createAlert(
			patientID,
			measurement,
			`${getMeasurementName(measurement)} was between ${message}${setting.unit}`,
			currAlertLevel
		);
	} else if (currAlertLevel === 2) {
		const message = measurement === 'spo2' ? 'was below' : 'exceeded';
		createAlert(
			patientID,
			measurement,
			`${getMeasurementName(measurement)} ${message} ${severe}${setting.unit}`,
			currAlertLevel
		);
	}

	return currAlertLevel;
};

const getMeasurementName = (measurement: string) => {
	if (measurement === 'ahi') return 'AHI';
	if (measurement === 'spo2') return 'SpO2';
	if (measurement === 'temp') return 'Temperature';
	if (measurement === 'tilt') return 'Head Tilt';
	if (measurement === 'usage') return 'Usage';
};
