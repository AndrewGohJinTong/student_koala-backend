import {
    AllowNull,
    BelongsTo,
    Column,
    CreatedAt,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import Patient from './Patient';

@Table
class Device extends Model {
    @PrimaryKey
    @Column
    cradleID!: number;

    @PrimaryKey
    @Column
    mouthguardID!: number;

    @AllowNull(false)
    @Column
    devicePin!: number;

    @ForeignKey(() => Patient)
    @Column
    patientID!: number;

    @BelongsTo(() => Patient)
    patient!: Patient;

    @AllowNull(false)
    @Column
    batteryLevel!: number;

    @AllowNull(false)
    @Column
    batteryHealth!: number;

    @Column
    lastLogin!: Date;

    @Column
    lastTransmission!: Date;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default Device;
