import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import DataEnum from './DataEnum';

@Table({
  paranoid: true
})
class ObsvDescript extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  obsvDescId!: number;

  @AllowNull(false)
  @Column
  obsvName!: string;

  @AllowNull(false)
  @Column
  description!: string

  @AllowNull(false)
  @Column
  unit!: string

  @AllowNull(false)
  @ForeignKey(() => DataEnum)
  @Column
  dataEnumId!: number;

  @CreatedAt
  @Column
  createdAt!: Date;

  @UpdatedAt
  @Column
  updatedAt!: Date;

  @DeletedAt
  @Column
  deletedAt!: Date;
}

export default ObsvDescript;
