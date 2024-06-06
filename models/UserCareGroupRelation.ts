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
import CareGroup from './CareGroup';
import User from './User';

@Table
class UserCareGroupRelation extends Model {
    @PrimaryKey
    @ForeignKey(() => User)
    @AllowNull(false)
    @Column
    userID!: number;

    @BelongsTo(() => User)
    userData!: User;

    @PrimaryKey
    @ForeignKey(() => CareGroup)
    @AllowNull(false)
    @Column
    careGroupID!: number;

    @BelongsTo(() => CareGroup)
    careGroupData!: CareGroup;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default UserCareGroupRelation;
