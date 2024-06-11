import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import { HttpException } from '../exceptions/HttpException';
import { checkSameCareGroup, isSameCareGroup } from '../helpers/accessControl';
import { validateEmail } from '../helpers/helpers';
import Clinician from '../models/Clinician';
import Patient from '../models/Patient';
import User from '../models/User';

// auth0ID: The Auth0 ID of the user to be requested
// currUserAuth0ID: The Auth0 ID of the user who made the request. It is retrieved from the decoded access token in the authorization header
export const getSelfPatientProfile = async (userID: string, currUserAuth0ID: string) => {
	console.log(`[Server] Getting patient with userID ${userID}'s own profile`);

	const currUser = await User.findOne({ where: { userID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'patient') {
		throw new HttpException(403, 'Staff should use "/user/patient" instead');
	} else if (currUser.role === 'patient' && currUser.auth0ID !== currUserAuth0ID) {
		throw new HttpException(403, "You cannot view other users' profiles");
	}

	const user = await Patient.findOne({
		include: [{ model: User, where: { userID }, attributes: { exclude: ['creationDate', 'updatedOn'] } }],
		attributes: { exclude: ['userID', 'creationDate', 'updatedOn'] },
	});

	if (!user) throw new HttpException(400, `Patient with userID ${userID} not found`);

	return user;
};

export const getPatientProfile = async (userID: number, currUserAuth0ID: string) => {
	console.log(`[Server] Getting profile of patient with userID ${userID}`);

	const currUser = await User.findOne({ where: { auth0ID: currUserAuth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');

	try {
		checkSameCareGroup(currUserAuth0ID, userID);
	} catch (err) {
		throw err;
	}

	const user = await Patient.findOne({
		include: [{ model: User, where: { userID }, attributes: { exclude: ['creationDate', 'updatedOn'] } }],
		attributes: { exclude: ['userID', 'creationDate', 'updatedOn'] },
	});

	if (!user) throw new HttpException(400, `Patient with user ID ${userID} not found`);

	return user;
};

export const getStaffProfile = async (userID: string, currUserAuth0ID: string) => {
	console.log(`[Server] Getting profile of staff with user ID ${userID}`);

	// const isAuth0Id = userID.length === 24;
	const isAuth0Id = true;

	const currUser = await User.findOne({ where: { auth0ID: currUserAuth0ID } });
	console.log(currUser);
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin') {
		if (isAuth0Id && userID === currUserAuth0ID) {
			throw new HttpException(403, "You cannot view other user's profiles");
		} else if (!isAuth0Id && parseInt(userID) === currUser.userID) {
			throw new HttpException(403, "You cannot view other user's profiles");
		}
	}

	const user = await (Clinician).findOne({
		include: [
			{
				model: User,
				where: { auth0ID: userID },
				attributes: { exclude: ['creationDate', 'updatedOn'] },
			},
		],
		attributes: { exclude: ['userID', 'creationDate', 'updatedOn'] },
	});

	if (!user) throw new HttpException(400, `Staff with user ID ${userID} not found`);

	return user;
};

export const getAllUsers = async (auth0ID: string) => {
	console.log('[Server] Getting all users');

	try {
		const currUser = await User.findOne({ where: { auth0ID } });
		if (!currUser) throw new HttpException(401, 'Invalid token');
	
		const allUsers = await User.findAll({
			where: { role: { [Op.ne]: 'admin' } },
			attributes: { exclude: ['creationDate', 'updatedOn'] },
		});
	
		const allPatients = await User.findAll({
			where: { role: { [Op.eq]: 'patient' } },
			attributes: { exclude: ['creationDate', 'updatedOn'] },
		});
		let result;

		if (currUser.role === 'admin') {
			result = allUsers;
		} else {
			result = [];
			for (const patient of allPatients) {
				const isSameGroup = await isSameCareGroup(auth0ID, patient.userID);
				if (isSameGroup) {
					result.push(patient);
				}
			}
		}
		return result;
	} catch (error) {
		console.error('[Server] Error fetching users:', error);
        throw new HttpException(500, 'Internal Server Error');
	}

};

export const editUser = async (
	userID: number,
	firstName: string | undefined,
	lastName: string | undefined,
	gender: string | undefined,
	birthday: string | undefined,
	phone: string | undefined,
	email: string | undefined,
	isActive: boolean | undefined,
	auth0ID: string
) => {
	console.log(`[Server] Editing user profile for user ${userID}`);
	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');

	const user = await User.findByPk(userID);
	if (user === null) throw new HttpException(400, 'User not found');

	if (currUser.role !== 'admin' && auth0ID !== user.auth0ID) {
		throw new HttpException(403, "You cannot edit another user's profile");
	}
	if (email && !validateEmail(email)) throw new HttpException(400, 'Invalid email address');

	let parsedBirthday: DateTime | null = null;
	if (birthday) {
		parsedBirthday = DateTime.fromFormat(birthday, 'dd/MM/yyyy');
		if (!parsedBirthday.isValid) throw new HttpException(400, 'Invalid birthday');
	}

	const existingUser = await User.findOne({
		where: { [Op.or]: [{ phone: phone ? phone : '' }, { email: email ? email : '' }], userID: { [Op.ne]: userID } },
	});
	if (existingUser !== null)
		throw new HttpException(400, 'A user with the same phone number or email address already exists');

	const userData: Record<string, any> = {
		firstName,
		lastName,
		gender,
		birthday: parsedBirthday ? parsedBirthday.toISODate() : undefined,
		phone,
		email,
		isActive,
	};
	for (const [key, value] of Object.entries(userData)) {
		if (value === undefined) delete userData[key];
	}

	await User.update({ ...userData }, { where: { userID } });
};

export const deactivateUser = async (userID: number, auth0ID: string) => {
	console.log(`[Server] Deactivating user ${userID}`);

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin' && auth0ID !== currUser.auth0ID) {
		throw new HttpException(403, "You cannot deactivate another user's profile");
	}

	const user = await User.findByPk(userID);
	if (user === null) throw new HttpException(400, 'User not found');

	await User.update({ isActive: false }, { where: { userID } });
};
