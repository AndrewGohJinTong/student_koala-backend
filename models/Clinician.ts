import {
    BelongsTo,
    Column,
    CreatedAt,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import Alert from './Alert';
import User from './User';

@Table
class Clinician extends Model {
    @PrimaryKey
    @ForeignKey(() => User)
    @Column
    userID!: number;

    @BelongsTo(() => User)
    userData!: User;

    @HasMany(() => Alert)
    alerts!: Alert[];

    @Column
    deviceNonce!: string;

    @Column
    nonceExpiry!: Date;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default Clinician;
