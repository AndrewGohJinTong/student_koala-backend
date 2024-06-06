import { Request } from 'express-jwt';
import { Op } from 'sequelize';
import { HttpException } from '../exceptions/HttpException';
import User from '../models/User';
import { sequelize } from './database';
import UserCareGroupRelation from '../models/UserCareGroupRelation';

export const getAuth0IDFromHeader = (req: Request) => {
  // return req.auth?.sub?.split('|')[1] as string;
  return req.headers['auth0id'] as string;
};

export const extractBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};
export const isSameCareGroup = async (staffAuth0ID: string, patientID: number) => {
  const staff = await User.findOne({ where: { auth0ID: staffAuth0ID } });
  if (!staff) return false;
  if (staff.role === 'admin') return true;
  try {
    // Find care groups for the staff user
    const staffCareGroups = await UserCareGroupRelation.findAll({
        where: {
            userID: staff.userID
        },
        attributes: ['careGroupID']
    });

    // Extract care group IDs for the staff user
    const staffCareGroupIDs = staffCareGroups.map(relation => relation.careGroupID);

    // Check if any of the care group IDs match with the patient user's care group IDs
    const matchingGroups = await UserCareGroupRelation.findOne({
        where: {
            userID: patientID,
            careGroupID: {
                [Op.in]: staffCareGroupIDs
            }
        }
    });

    return matchingGroups !== null;
  } catch (error) {
    console.error('Error checking care group relation:', error);
    return false;
  }
}



export const checkSameCareGroup = async (staffAuth0ID: string, patientID: number) => {
  const currUser = await User.findOne({ where: { auth0ID: staffAuth0ID } });
  if (!currUser) throw new HttpException(401, 'Invalid token');
  if (!isSameCareGroup(staffAuth0ID, patientID)) {
    throw new HttpException(403, 'You are not in the same care group');
  }
};
