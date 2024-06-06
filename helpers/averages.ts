import DeviceData from '../models/DeviceData';
import Patient from '../models/Patient';
import User from '../models/User';

// Return the data summary for a given patient
export const getSummary = async (patient: User, data: DeviceData[]) => {
  const patientData = await Patient.findByPk(patient.userID);

  return {
    userID: patient.userID,
    firstName: patient.firstName,
    lastName: patient.lastName,
    alertLevel: patientData!.alertLevel,
    ahi: getAvgOfMeasurements(getMeasurement(data, 'ahi')),
    spo2: getAvgOfMeasurements(getMeasurement(data, 'spo2')),
    temp: getAvgOfMeasurements(getMeasurement(data, 'temp')),
    tilt: getAvgOfMeasurements(getMeasurement(data, 'tilt')),
    usage: average(getMeasurement(data, 'usage').map((d) => parseInt(d))),
    lastTransmission: new Date(
      data
        .map((d) => new Date(d.creationDate))
        .sort()
        .slice(-1)[0]
    ),
  };
};

const getMeasurement = (data: DeviceData[], measurement: string) =>
  data.filter((d) => d.measurement === measurement).map((d) => d.dataPoints);

// Calculate the average reading each night, then find the average of all nights' averages
const getAvgOfMeasurements = (measurements: string[]) => {
  if (!measurements) return null;

  const dataStrings: string[][] = measurements.map((d) => JSON.parse(d));
  const dataNums = dataStrings.map((strings) => strings.map((str) => parseInt(str)));
  const nightAvgs = dataNums.map((night) => average(night));
  return average(nightAvgs);
};

// Find the average of a list of numbers
const average = (nums: number[]) => nums.reduce((prev, curr) => prev + curr, 0) / nums.length;
