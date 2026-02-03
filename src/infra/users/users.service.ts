import { Injectable } from '@nestjs/common';

export type User =
  | {
      userId: number;
      username: string;
      password: string;
    }
  | undefined;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  findOne(username: string) {
    const user = this.users.find((user) => user.username === username);
    return user;
  }
}
