import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import Alert from '../models/Alert';
import CareGroup from '../models/CareGroup';
import Clinician from '../models/Clinician';
import Device from '../models/Device';
import DeviceData from '../models/DeviceData';
import Note from '../models/Note';
import Patient from '../models/Patient';
import Setting from '../models/Setting';
import User from '../models/User';
import UserCareGroupRelation from '../models/UserCareGroupRelation';
import { Dialect } from 'sequelize';
import Threshold from '../models/Threshold';
import ObsvDescript from '../models/ObsvDescript';
import DataEnum from '../models/DataEnum';

dotenv.config();

export const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_HOST),
  dialect: 'postgres' as Dialect,
  // dialectOptions: {
  //   options: {
  //     encrypt: true,
  //     trustServerCertificate: false,
  //   },
  // },
  models: [User, Patient, Clinician, CareGroup, UserCareGroupRelation, DeviceData, Alert, Device, Note, Setting, Threshold, ObsvDescript, DataEnum],
  pool: {
    max: 10,
    min: 0,
    idle: 30000,
  },
  logging: false,
});

export const initDb = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({alter: true});
    console.log('[Database] Successfully connected to database');
  } catch (err) {
    console.error(`[Error] Failed to connect to database: ${err}`);
  }
};
