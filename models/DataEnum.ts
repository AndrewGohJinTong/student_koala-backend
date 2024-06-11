import {
  AllowNull,
  AutoIncrement,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

@Table
class DataEnum extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  dataEnumId!: number;

  @Unique(true)
  @AllowNull(false)
  @Column
  name!: string;
}

export default DataEnum;