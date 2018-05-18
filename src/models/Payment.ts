export default interface Payment {
  id: number;
  payer_id: number;
  confirmer_id: number;
  created: Date;
  reference_number: string;
  amount: number;
  valid_until: Date;
  paid: Date;
  payment_type: string;
}
