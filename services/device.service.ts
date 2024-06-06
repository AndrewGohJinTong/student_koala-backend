import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { UniqueConstraintError } from 'sequelize';
import { HttpException } from '../exceptions/HttpException';
import { checkSameCareGroup } from '../helpers/accessControl';
import Clinician from '../models/Clinician';
import Device from '../models/Device';
import User from '../models/User';

// Note: The auth0ID parameter in these methods is the auth0ID of the user who triggered this operation
// It is retrieved from the decoded access token in the authorization header

export const getDevice = async (patientID: number, auth0ID: string) => {
	console.log(`[Server] Getting device for patient ${patientID}`);

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const device = await Device.findOne({ where: { patientID }, attributes: { exclude: ['creationDate', 'updatedOn'] } });

	return { device };
};

export const provisionDevice = async (
	patientID: number,
	cradleID: string,
	mouthguardID: string,
	nonce: string,
	auth0ID: string
) => {
	console.log(`[Server] Provisioning mouthguard ${mouthguardID} and cradle ${cradleID} to patient ${patientID}`);

	const user = await User.findByPk(patientID);
	if (user === null) throw new HttpException(400, 'User not found');
	if (user.role !== 'patient') throw new HttpException(400, 'Invalid user');

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	const clinician = await Clinician.findOne({
		where: { deviceNonce: nonce },
		include: [{ model: User, where: { auth0ID } }],
	});
	if (!clinician) throw new HttpException(403, 'You are not authorised to provision this device');

	// Check if nonce expired
	const now = new Date();
	if (now.getTime() - clinician.nonceExpiry.getTime() < 0) throw new HttpException(403, 'Invalid nonce');

	const devicePin = Math.floor(1000 + Math.random() * 9000);

	try {
		await Device.create({
			cradleID,
			mouthguardID,
			devicePin,
			patientID,
			batteryLevel: 100,
			batteryHealth: 100,
		});

		return { cradleID, mouthguardID, devicePin };
	} catch (err) {
		if (err instanceof UniqueConstraintError) {
			throw new HttpException(400, 'This cradle/mouthguard has already been assigned to a patient');
		} else {
			throw new HttpException(400, 'Unable to provision device');
		}
	}
};

export const deprovisionDevice = async (patientID: number, auth0ID: string) => {
	console.log(`[Server] Deprovisioning device from patient ${patientID}`);

	const device = await Device.findOne({ where: { patientID } });
	if (device === null) throw new HttpException(400, 'Device not found');

	try {
		await checkSameCareGroup(auth0ID, patientID);
	} catch (err) {
		throw err;
	}

	await Device.destroy({ where: { patientID } });
};

export const authenticateDevice = async (cradleID: number, mouthguardID: number, devicePin: number) => {
	console.log(`[Server] Cradle ${cradleID} and mouthguard ${mouthguardID} logging in`);

	const device = await Device.findOne({ where: { cradleID, mouthguardID } });
	if (device === null || device.devicePin !== devicePin) throw new HttpException(400, 'Incorrect details');

	await Device.update({ lastLogin: new Date() }, { where: { cradleID, mouthguardID } });

	const token = jwt.sign({ cradleID, mouthguardID }, process.env.JWT_SECRET!, { expiresIn: '12h' });

	return { token };
};

export const generateNonce = async (auth0ID: string) => {
	console.log(`[Server] Generating nonce for clinician ${auth0ID} to provision device`);

	const clinician = await Clinician.findOne({ include: { model: User, where: { auth0ID } } });
	if (clinician === null) throw new HttpException(400, 'User not found');

	const nonce = randomBytes(32).toString('base64');
	const expiry = 5;
	await Clinician.update(
		{ deviceNonce: nonce, nonceExpiry: new Date(new Date().getTime() + expiry * 60000) },
		{ where: { userID: clinician.userID } }
	);

	return { nonce };
};

export const clearNonce = async (auth0ID: string) => {
	console.log(`[Server] Clearning nonce for clinician ${auth0ID}`);

	const clinician = await Clinician.findOne({ include: { model: User, where: { auth0ID } } });
	if (clinician === null) throw new HttpException(400, 'User not found');
	await Clinician.update({ deviceNonce: '', nonceExpiry: new Date() }, { where: { userID: clinician.userID } });
};

export const getLastLogin = async (cradleID: number, mouthguardID: number) => {
	console.log(`[Server] Getting last login time for cradle ${cradleID} and mouthguard ${mouthguardID}`);

	const device = await Device.findOne({ where: { cradleID, mouthguardID } });

	if (device === null) throw new HttpException(400, 'Device not found');

	return { lastLogin: device.lastLogin };
};

export const getLastTransmission = async (cradleID: number, mouthguardID: number) => {
	console.log(`[Server] Getting last transmission time for cradle ${cradleID} and mouthguard ${mouthguardID}`);

	const device = await Device.findOne({ where: { cradleID, mouthguardID } });

	if (device === null) throw new HttpException(400, 'Device not found');

	return { lastTransmission: device.lastTransmission.toISOString() };
};
