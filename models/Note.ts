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
class Note extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    noteID!: number;

    @ForeignKey(() => Patient)
    @AllowNull(false)
    @Column
    patientID!: number;

    @BelongsTo(() => Patient)
    patient!: Patient;

    @ForeignKey(() => Clinician)
    @AllowNull(false)
    @Column
    clinicianID!: number;

    @BelongsTo(() => Clinician)
    clinician!: Clinician;

    @AllowNull(false)
    @Column
    description!: string;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;

    @AllowNull(false)
    @Column
    isResolved!: boolean;
}

export default Note;
