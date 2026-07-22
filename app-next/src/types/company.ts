export interface ICompanyDTO {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  defaultOfferTemplate?: string;
}

export interface ICompanyCreateDTO {
  name: string;
}

export interface ICompanyUpdateDTO {
  name?: string;
}
