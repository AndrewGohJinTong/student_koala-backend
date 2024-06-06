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
class User extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    userID!: number;

    @AllowNull(false)
    @Column
    auth0ID!: string;

    @AllowNull(false)
    @Column
    firstName!: string;

    @AllowNull(false)
    @Column
    lastName!: string;

    @AllowNull(false)
    @Column
    gender!: 'male' | 'female';

    @AllowNull(false)
    @Column
    birthday!: Date;

    @AllowNull(false)
    @Column
    role!: 'patient' | 'clinician' | 'admin';

    @AllowNull(false)
    @Unique(true)
    @Column
    phone!: string;

    @Unique(true)
    @Column
    email!: string;

    @AllowNull(false)
    @Column
    isActive!: boolean;

    @CreatedAt
    @Column
    creationDate!: Date;

    @UpdatedAt
    @Column
    updatedOn!: Date;
}

export default User;
