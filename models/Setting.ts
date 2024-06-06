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
class Setting extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    settingID!: number;

    @ForeignKey(() => Patient)
    @AllowNull(false)
    @Column
    patientID!: number;

    @BelongsTo(() => Patient)
    patient!: Patient;

    @AllowNull(false)
    @Column
    settingName!: string;

    @AllowNull(false)
    @Column
    primaryValue!: number;

    @Column
    secondaryValue!: number;

    @Column
    tertiaryValue!: number;

    @Column
    changeReason!: string;

    @AllowNull(false)
    @Column
    unit!: string;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default Setting;
