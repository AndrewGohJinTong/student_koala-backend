import ObsvDescript from "../models/ObsvDescript";

export const addObsvType = async (obsvName: string, description: string, unit: string, dataEnumId: number) => {
  console.log(`[Server] Adding new observation ${obsvName}`);
  // TODO: handle authorisation

  const newObsv = {
    obsvName,
    description,
    unit,
    dataEnumId,
  };
  await ObsvDescript.create(newObsv);
};

export const listObsvTypes = async () => {
  console.log(`[Server] Listing observations`);
  // TODO: handle authorisation

  const allObsvType = await ObsvDescript.findAll();
  return allObsvType;
};

export const deleteObsvType = async (obsvName: string) => {
  // TODO: handle authorisation

  console.log(`[Server] Deleting observation ${obsvName}`);
  await ObsvDescript.destroy({
    where: {
      obsvName,
    },
  });``
};