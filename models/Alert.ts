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
import Clinician from './Clinician';
import Patient from './Patient';

@Table
class Alert extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    alertID!: number;

    @ForeignKey(() => Patient)
    @AllowNull(false)
    @Column
    patientID!: number;

    @BelongsTo(() => Patient)
    patient!: Patient;

    @ForeignKey(() => Clinician)
    @Column
    clinicianID!: number;

    @BelongsTo(() => Clinician)
    clinician!: Clinician;

    @AllowNull(false)
    @Column
    alertName!: string;

    @AllowNull(false)
    @Column
    description!: string;

    @AllowNull(false)
    @Column
    alertLevel!: number;

    @AllowNull(false)
    @Column
    isResolved!: boolean;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default Alert;
