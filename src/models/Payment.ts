export interface IPayment {
  id?: number;
  payer_id?: number;
  confirmer_id?: number;
  created?: Date;
  reference_number?: string;
  amount?: number;
  valid_until?: Date;
  paid?: Date;
  payment_type?: string;
}

export default class Payment implements IPayment {
  id: number;
  payer_id: number;
  confirmer_id: number;
  created: Date;
  reference_number: string;
  amount: number;
  valid_until: Date;
  paid: Date;
  payment_type: string;

  constructor(payment: IPayment) {
    Object.keys(payment).map(key => {
      this[key] = payment[key];
    });
  }
}
