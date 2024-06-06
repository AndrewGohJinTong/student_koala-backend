import { Op, UniqueConstraintError } from 'sequelize';
import { HttpException } from '../exceptions/HttpException';
import { isSameCareGroup } from '../helpers/accessControl';
import CareGroup from '../models/CareGroup';
import User from '../models/User';
import UserCareGroupRelation from '../models/UserCareGroupRelation';

// Note: The auth0ID parameter in these methods is the auth0ID of the user who triggered this operation
// It is retrieved from the decoded access token in the authorization header

export const getAllCareGroups = async (auth0ID: string) => {
	console.log(`[Server] Getting all care groups`);

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin') throw new HttpException(403, 'Only an administrator can view all care groups');

	const careGroups = await CareGroup.findAll({ attributes: { exclude: ['creationDate', 'updatedOn'] } });

	// Number of clinicians and patients in each care group
	const careGroupsCount = await Promise.all(
		careGroups.map(async (careGroup) => {
			const clinicians = await UserCareGroupRelation.count({
				where: { careGroupID: careGroup.groupID },
				include: [{ model: User, where: { role: 'clinician' } }],
			});

			const patients = await UserCareGroupRelation.count({
				where: { careGroupID: careGroup.groupID },
				include: [{ model: User, where: { role: 'patient' } }],
			});

			return {
				clinicians,
				patients,
			};
		})
	);

	const result = careGroups.map((careGroup, index) => {
		return {
			groupInfo: careGroup,
			count: {
				clinicians: careGroupsCount[index].clinicians,
				patients: careGroupsCount[index].patients,
			},
		};
	});

	return result;
};

export const getUsersCareGroups = async (auth0ID: string, userID: number) => {
	console.log(`[Server] Getting care groups which user ${userID} is part of`);

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin' && currUser.userID !== userID && !isSameCareGroup(auth0ID, userID)) {
		throw new HttpException(403, 'You can only view your own care groups or the care groups of your assigned patients');
	}

	const careGroups = await UserCareGroupRelation.findAll({
		where: { userID },
		include: [CareGroup],
		attributes: { exclude: ['creationDate', 'updatedOn'] },
	});

	return {
		careGroups: careGroups.map((group) => group.careGroupData),
	};
};

export const getUsersInCareGroup = async (auth0ID: string, careGroupID: number) => {
	console.log(`[Server] Getting users in care group ${careGroupID}`);

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');

	if (currUser.role !== 'admin') {
		const currUserGroup = await UserCareGroupRelation.findOne({ where: { userID: currUser.userID, careGroupID } });
		if (currUserGroup === null) {
			throw new HttpException(403, 'You are not part of this care group');
		}
	}

	const careGroup = await CareGroup.findByPk(careGroupID, { attributes: { exclude: ['creationDate', 'updatedOn'] } });
	if (careGroup === null) throw new HttpException(400, 'Invalid care group ID');

	const result = await UserCareGroupRelation.findAll({
		where: { careGroupID },
		include: [User],
		attributes: { exclude: ['creationDate', 'updatedOn'] },
	});

	const clinicians = result
		.filter((relation) => relation.userData.role === 'clinician')
		.map((relation) => relation.userData);
	const patients = result
		.filter((relation) => relation.userData.role === 'patient')
		.map((relation) => relation.userData);

	return {
		groupInfo: careGroup,
		clinicians,
		patients,
	};
};

export const createCareGroup = async (auth0ID: string, groupName: string) => {
	console.log(`[Server] Creating care group ${groupName}`);

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin') throw new HttpException(403, 'Only an administrator can create care groups');

	try {
		await CareGroup.create({ groupName });
	} catch (err) {
		if (err instanceof UniqueConstraintError) {
			throw new HttpException(400, 'Care group already exists');
		} else {
			throw new HttpException(400, 'Unable to create care group');
		}
	}
};

export const assignToCareGroup = async (auth0ID: string, userID: number, careGroupID: number) => {
	console.log(`[Server] Assigning user ${userID} to care group ${careGroupID}`);

	const targetUser = await User.findByPk(userID);
	if (targetUser === null) throw new HttpException(400, 'User not found');

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin' && targetUser.role === 'clinician') {
		throw new HttpException(403, 'Only an administrator can assign clinicians to care groups');
	}

	try {
		await UserCareGroupRelation.create({ userID, careGroupID });
	} catch (err) {
		if (err instanceof UniqueConstraintError) {
			throw new HttpException(400, 'User is already part of care group');
		} else {
			throw new HttpException(400, 'Unable to assign user to care group');
		}
	}
};

export const unassignFromCareGroup = async (auth0ID: string, userID: number, careGroupID: number) => {
	console.log(`[Server] Unassigning user ${userID} from care group ${careGroupID}`);

	const targetUser = await User.findByPk(userID);
	if (targetUser === null) throw new HttpException(400, 'User not found');

	const currUser = await User.findOne({ where: { auth0ID } });
	if (!currUser) throw new HttpException(401, 'Invalid token');
	if (currUser.role !== 'admin') {
		throw new HttpException(403, 'Only an administrator can unassign users from care groups');
	}

	const res = await UserCareGroupRelation.destroy({ where: { [Op.and]: [{ userID }, { careGroupID }] } });
	if (res == 0) throw new HttpException(400, `User is not part of that care group`);
};
