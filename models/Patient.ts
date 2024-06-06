import {
    AllowNull,
    BelongsTo,
    Column,
    CreatedAt,
    ForeignKey,
    HasMany,
    HasOne,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
    AfterCreate
} from 'sequelize-typescript';
import Device from './Device';
import Note from './Note';
import Alert from './Alert';
import User from './User';
import Threshold from './Threshold';

@Table
class Patient extends Model {
    @PrimaryKey
    @ForeignKey(() => User)
    @Column
    userID!: number;

    @BelongsTo(() => User)
    userData!: User;

    @HasOne(() => Device)
    device!: Device;

    @AllowNull(false)
    @Column
    alertLevel!: number;

    @HasMany(() => Alert)
    alerts!: Alert[];

    @HasMany(() => Note)
    notes!: Note[];

    @HasMany(() => Threshold)
    thresholds!: Threshold[];

    @AfterCreate
    static async createDefaultThresholds(patient: Patient) {
        await Threshold.bulkCreate([
        {
            patientID: patient.userID,
            upperValue: 8,
            measurement: 'usage',
            comments: '',
            unit: ' hour(s)',
            active: false,
        },
        {
            patientID: patient.userID,
            lowerValue: 15,
            upperValue: 30,
            measurement: 'ahi',
            comments: '',
            unit: ' event(s)/hour',
            active: false,
        },
        {
            patientID: patient.userID,
            lowerValue: 80,
            upperValue: 90,
            measurement: 'spo2',
            comments: '',
            unit: '%',
            active: false,
        },

        {
            patientID: patient.userID,
            lowerValue: 37,
            upperValue: 39,
            measurement: 'temp',
            comments: '',
            unit: '°C',
            active: false,
        },
        {
            patientID: patient.userID,
            lowerValue: 360, //????
            upperValue: 360, //????
            measurement: 'tilt',
            comments: '',
            unit: '°',
            active: false,
        },
        ]);
    }

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default Patient;
