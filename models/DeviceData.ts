import { DataTypes } from 'sequelize';
import {
    AllowNull,
    AutoIncrement,
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
class DeviceData extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    observationID!: number;

    @ForeignKey(() => Patient)
    @Column
    patientID!: number;

    @BelongsTo(() => Patient)
    patient!: Patient;

    @AllowNull(false)
    @Column
    measurement!: string;

    @AllowNull(false)
    @Column
    start!: Date;

    @AllowNull(false)
    @Column
    end!: Date;

    @AllowNull(false)
    @Column
    sampleRate!: number;

    @AllowNull(false)
    @Column({ type: DataTypes.TEXT })
    dataPoints!: string;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default DeviceData;
