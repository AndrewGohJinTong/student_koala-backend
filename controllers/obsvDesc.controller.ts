import { NextFunction, Request, Response } from "express";
import * as obsvDescService from '../services/obsvDesc.service';


export const addObsvType = async (req: Request, res: Response, next: NextFunction) => {
  const { obsvName, description, unit, dataEnumId } = req.body;
  try {
    // TODO: Check perms
    await obsvDescService.addObsvType(
      obsvName,
      description,
      unit,
      dataEnumId,
    );
    res.sendStatus(200);
  } catch(err) {
    console.log(`error: ${err}`);
    next(err);
  }
};

export const listObsvTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Check perms
    const allObsvTypes = await obsvDescService.listObsvTypes();
    res.send({
      body: allObsvTypes
    })
  } catch(err) {
    next(err);
  }
};

export const deleteObsvType = async (req: Request, res: Response, next: NextFunction) => {
  const obsvName = req.params.obsvName;
  try {
    // TODO: Check perms
    await obsvDescService.deleteObsvType(obsvName);
    res.sendStatus(200);
  } catch(err) {
    next(err);
  };
}