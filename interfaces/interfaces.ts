export interface IDataRaw {
    metadata: IDeviceMetadata;
    ahi: any[];
    temp: any[];
    tilt: any[];
    spo2: any[];
    usage: number; // In Unix time
}

export interface IDataParsed {
    patientID: number;
    measurement: string;
    start: Date;
    end: Date;
    sampleRate: number;
    dataPoints: string;
}

export interface IDataSummary {
    firstName: string;
    lastName: string;
    alertLevel: number;
    ahi: number | null;
    spo2: number | null;
    temp: number | null;
    tilt: number | null;
    usage: number | null;
    lastTransmission: Date;
}

export interface IDeviceMetadata {
    cradleID: number;
    mouthguardID: number;
    batteryLevel: number;
    batteryHealth: number;
    timeStamp: number;
}

export interface ILoginResult {
    access_token: string;
    refresh_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
}

export interface ISignupResult {
    _id: string;
    email_verified: boolean;
    email: string;
    username: string;
    given_name: string;
    family_name: string;
    name: string;
    nickname: string;
    picture: string;
}

export interface IIDToken {
    given_name: string;
    family_name: string;
    nickname: string;
    name: string;
    picture: string;
    updated_at: string;
}

export interface ISettingReq {
    settingID: string;
    patientID: number;
    settingName: string;
    primaryValue: string;
    secondaryValue?: string;
    tertiaryValue?: string;
    changeReason: string;
    unit: string;
}

export interface ISetting {
    settingID?: number;
    patientID?: number;
    settingName: string;
    primaryValue: number;
    secondaryValue?: number;
    tertiaryValue?: number;
    changeReason: string;
    unit: string;
}

export interface IDeviceJWT {
    cradleID: number;
    mouthguardID: number;
}
