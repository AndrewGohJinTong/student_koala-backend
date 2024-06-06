import {
    AllowNull,
    AutoIncrement,
    Column,
    CreatedAt,
    Model,
    PrimaryKey,
    Table,
    Unique,
    UpdatedAt,
} from 'sequelize-typescript';

@Table
class CareGroup extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    groupID!: number;

    @AllowNull(false)
    @Unique(true)
    @Column
    groupName!: string;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default CareGroup;
