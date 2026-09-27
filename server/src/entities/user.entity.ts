import { Column, Entity, Unique } from 'typeorm';
import { CustomBaseEntity } from '../entities/custom-base.entity';

@Entity('users')
@Unique(['email'])
export class User extends CustomBaseEntity {
  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: false })
  isVerified: boolean;
}