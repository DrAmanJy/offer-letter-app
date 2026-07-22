export interface IOfferEmployeeDTO {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  passportNumber?: string;
}

export interface IOfferEmploymentDTO {
  position: string;
  department?: string;
  location?: string;
  employmentType?: string;
  standardHours?: string;
  salary: number;
  currency: string;
  joiningDate: string;
  managerName?: string;
  probationPeriod?: string;
  noticePeriod?: string;
}

export type OfferStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Sent' | 'Accepted';

export interface IOfferDTO {
  _id?: string;
  reference: string;
  company: string | any; // To support populated objects or raw ID
  employee: IOfferEmployeeDTO;
  employment: IOfferEmploymentDTO;
  terms?: string;
  offerContent: string;
  status: OfferStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOfferCreateDTO {
  company: string;
  employee: IOfferEmployeeDTO;
  employment: IOfferEmploymentDTO;
  terms?: string;
  offerContent: string;
  status?: OfferStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOfferUpdateDTO extends Partial<IOfferCreateDTO> {}
