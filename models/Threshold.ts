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
  
  import { DataTypes } from 'sequelize';
  import Patient from './Patient';
import { Col } from 'sequelize/types/utils';
  
  @Table
  class Threshold extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    thresholdID!: number;
  
    @ForeignKey(() => Patient)
    @AllowNull(false)
    @Column
    patientID!: number;
  
    @BelongsTo(() => Patient)
    patient!: Patient;
  
    @AllowNull(true) 
    @Column(DataTypes.FLOAT)
    lowerValue!: number | null;
  
    @AllowNull(true) 
    @Column(DataTypes.FLOAT)
    upperValue!: number | null;
  
    @AllowNull(false)
    @Column
    measurement!: string;
  
    @Column
    comments!: string;

    @Column
    unit!: string;

    @AllowNull(false)
    @Column
    active!: boolean

    @CreatedAt
    @Column
    creationDate!: Date;
  
    @UpdatedAt
    @Column
    updatedOn!: Date;
  }
  
  export default Threshold;