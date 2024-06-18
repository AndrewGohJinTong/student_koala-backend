import { NextFunction, Request, Response } from "express";
import * as dataEnumService from '../services/dataEnum.service';

export const addDataEnum = async (req: Request, res: Response, next: NextFunction) => {
  const { dataEnumName } = req.body;
  try {
    // TODO: Check perms
    await dataEnumService.addDataEnum(dataEnumName);
    res.sendStatus(200);
  } catch(err) {
    console.log(`error: ${err}`);
    next(err);
  }
};

export const listDataEnums = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Check perms
    const allDataEnums = await dataEnumService.listDataEnums();
    res.send({
      body: allDataEnums
    })
  } catch(err) {
    next(err);
  }
};