import User from "../models/User";
import Payment from "../models/Payment";

export interface UserPayment extends User, Payment {};