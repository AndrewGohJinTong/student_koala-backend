import DataEnum from "../models/DataEnum";

export const addDataEnum = async (dataEnumName: string) => {
  console.log(`[Server] Adding new data type Enum ${dataEnumName}`);
  // TODO: handle authorisation
  const dataEnumBody = {
    name: dataEnumName
  };
  await DataEnum.create(dataEnumBody);
};

export const listDataEnums = async () => {
  const allDataEnums = DataEnum.findAll();
  return allDataEnums;
}