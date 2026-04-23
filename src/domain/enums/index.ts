export enum Role {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  ADMIN = 'ADMIN',
}

export enum LeaseStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  LATE = 'LATE',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_BANKING = 'MOBILE_BANKING',
  CHEQUE = 'CHEQUE',
}
