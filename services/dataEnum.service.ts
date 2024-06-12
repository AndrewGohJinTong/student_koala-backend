import DataEnum from "../models/DataEnum";

export const addDataEnum = async (dataEnumName: string) => {
  console.log(`[Server] Adding new data type Enum ${dataEnumName}`);
  // TODO: handle authorisation
  await DataEnum.create({dataEnumName});
};