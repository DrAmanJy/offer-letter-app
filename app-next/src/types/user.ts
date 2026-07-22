export type UserRole = 'ADMIN' | 'HR' | 'VIEWER';

export interface IUserDTO {
  _id?: string;
  username: string;
  name: string;
  active?: boolean;
  role?: UserRole;
  lastLogin?: Date | string | null;
}

export interface IUserCreateDTO {
  username: string;
  name: string;
  password?: string;
  active?: boolean;
  role?: UserRole;
}

export interface IUserUpdateDTO extends Partial<IUserCreateDTO> {}
