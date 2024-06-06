import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import generator from 'generate-password';
import jwt_decode from 'jwt-decode';
import { DateTime } from 'luxon';
import { Op } from 'sequelize';
// import { DASHBOARD_URL } from '../config';
import { HttpException } from '../exceptions/HttpException';
import { createIdFromEmail, validateEmail } from '../helpers/helpers';
import { IIDToken, ILoginResult, ISignupResult } from '../interfaces/interfaces';
import Clinician from '../models/Clinician';
import Patient from '../models/Patient';
import User from '../models/User';
import { createDefaultSettings } from './treatment.service';
import { decode } from 'punycode';

dotenv.config();

export const login = async (authorizationCode: string) => {
	console.log(`[Server] Exchanging authorization code ${authorizationCode} for token`);

	const body = {
		grant_type: 'authorization_code',
		client_id: process.env.AUTH_CLIENT_ID,
		client_secret: process.env.AUTH_CLIENT_SECRET,
		code: authorizationCode,
		// redirect_uri: `${DASHBOARD_URL}/callback`,
		audience: process.env.AUTH_AUDIENCE,
	};

	const config = {
		headers: {
			'content-type': 'application/json',
		},
	};

	try {
		const result = await axios.post<ILoginResult>(`${process.env.AUTH_URL}/oauth/token`, body, config);
		const data = result.data;
		const decodedID = jwt_decode<IIDToken>(data.id_token);

		const user = await User.findOne({
			where: { email: decodedID.name },
			attributes: { exclude: ['creationDate', 'updatedOn'] },
		});

		if (!user) throw new HttpException(500, 'User cannot be found');
		if (!user.isActive) throw new HttpException(403, 'Account is deactivated');

		return data;
	} catch (err) {
		if (err instanceof AxiosError) {
			throw new HttpException(401, `Login failed: ${err.response?.data.error_description}`);
		} else if (err instanceof HttpException) {
			throw err;
		}
	}
};

export const logout = async (accessToken: string | undefined) => {
	console.log(`[Server] Logging out user`);

	if (!accessToken) return;

	const options = {
		headers: { Authorization: accessToken },
	};

	try {
		await axios.get(`${process.env.AUTH_URL}/v2/logout?client_id=${process.env.AUTH_CLIENT_ID}`, options);
	} catch (err) {
		if (err instanceof AxiosError) {
			throw new HttpException(401, `Logout failed: ${err.response?.data.error_description}`);
		} else if (err instanceof HttpException) {
			throw err;
		}
	}
};

export const register = async (
	currAuth0ID: string,
	firstName: string,
	lastName: string,
	gender: string,
	birthday: string,
	role: string,
	phone: string,
	email: string,
	password: string | undefined
) => {
	console.log(`[Server] Registering a new ${role} ${firstName} ${lastName}`);

	if (!['admin', 'patient', 'clinician'].includes(role)) throw new HttpException(400, 'Invalid user type');
	if (!validateEmail(email)) throw new HttpException(400, 'Invalid email address');
	
    // Try parsing the birthday with the time part first
    let parsedBirthday = DateTime.fromFormat(birthday, 'dd/MM/yyyy, HH:mm:ss');
    // If the first format fails, try the date-only format
    if (!parsedBirthday.isValid) {
        parsedBirthday = DateTime.fromFormat(birthday, 'dd/MM/yyyy');
    }
    if (!parsedBirthday.isValid) throw new HttpException(400, 'Invalid birthday');
	// The user performing the registration
	const currUser = await User.findOne({ where: { auth0ID: currAuth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role === 'clinician' && role !== 'patient') {
		throw new HttpException(403, 'Clinicians are only allowed to register patient accounts');
	}

	// auth0ID is the sha256 hash of the user's email
	let auth0ID = '';
	auth0ID = createIdFromEmail(email);

	// Adding user details to database
	const userData = {
		auth0ID,
		firstName,
		lastName,
		gender,
		birthday: parsedBirthday.toISODate(),
		role,
		phone,
		email,
		isActive: true,
	};
	const result = await User.create(userData);
	// console.log(result);
	const generatedID = result.getDataValue('userID');

	if (role === 'patient') {
		try{
			await Patient.create({ userID: generatedID, alertLevel: 0 });
			await createDefaultSettings(generatedID);
		}
		catch (err){
			throw err;
		}
	} else {
		await Clinician.create({ userID: generatedID });
	}

	try {
		if (!password) await changePassword(auth0ID, email);
	} catch (err) {
		throw err;
	}

	return generatedID;
};

export const changePassword = async (auth0ID: string, email: string) => {
	console.log(`[Server] Changing the password for ${email}`);

	const currUser = await User.findOne({ where: { auth0ID: auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.email !== email) throw new HttpException(403, 'You can only change the password for your own account');

	const body = {
		client_id: process.env.AUTH_CLIENT_ID,
		email: email,
		connection: 'Username-Password-Authentication',
	};

	try {
		await axios.post(`${process.env.AUTH_URL}/dbconnections/change_password`, body);
	} catch (err) {
		if (err instanceof AxiosError) {
			throw new HttpException(
				err.response?.data.statusCode,
				`Change password failed: ${err.response?.data.description}`
			);
		}
	}
};

export const getOrCreateUser = async (auth0ID: string) => {
	var user = await User.findOne({ where: { auth0ID: auth0ID } });
	if (!user) {
		await User.create({ 
			auth0ID: auth0ID, 
			isActive: true 
		});
		user = await User.findOne({ where: { auth0ID: auth0ID } });
	}

	return user;
}