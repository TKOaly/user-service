import * as express from "express";
import UserService from "../services/UserService";
import ServiceResponse from "../utils/ServiceResponse";
import { IController } from "./IController";
import AuthorizeMiddleware from "../utils/AuthorizeMiddleware";
import PaymentService from "../services/PaymentService";
import Payment from "../models/Payment";

/**
 * Payment controller.
 *
 * @export
 * @class PaymentController
 * @implements {IController}
 */
export default class PaymentController implements IController {
  route: express.Router;
  authorizeMiddleware: AuthorizeMiddleware;

  /**
   * Creates an instance of PaymentController.
   * @param {UserService} userService
   * @param {PaymentService} paymentService
   * @param {AuthenticationService} authenticationService
   * @memberof PaymentController
   */
  constructor(
    private userService: UserService,
    private paymentService: PaymentService
  ) {
    this.route = express.Router();
    this.authorizeMiddleware = new AuthorizeMiddleware(this.userService);
  }

  /**
   * Creates a payment.
   *
   * @param {express.Request} req
   * @param {express.Response} res
   * @returns
   * @memberof PaymentController
   */
  async createPayment(req: express.Request, res: express.Response) {
    try {
      const paymentData: Payment = req.body;
      if (paymentData.id) {
        delete paymentData.id;
      }
      paymentData.created = new Date();
      const paymentIds: number[] = await this.paymentService.createPayment(
        req.body
      );
      const payment: Payment = await this.paymentService.fetchPayment(
        paymentIds[0]
      );
      return res.status(201).json(new ServiceResponse(payment, "Payment created", true));
    } catch (err) {
      return res
        .status(err.httpErrorCode || 500)
        .json(new ServiceResponse(null, err.message));
    }
  }

  /**
   * Modifies a payment.
   *
   * @param {express.Request} req
   * @param {express.Response} res
   * @returns
   * @memberof PaymentController
   */
  async modifyPayment(req: express.Request, res: express.Response) {
    try {
      const updatedPayment: boolean = await this.paymentService.updatePayment(
        req.params.id,
        req.body
      );
      return res
        .status(200)
        .json(new ServiceResponse(updatedPayment, "Payment modified", true));
    } catch (err) {
      return res
        .status(err.httpErrorCode || 500)
        .json(new ServiceResponse(null, err.message));
    }
  }

  /**
   * Returns all payments.
   *
   * @param {express.Request} req
   * @param {express.Response} res
   * @returns
   * @memberof PaymentController
   */
  async getAllPayments(req: express.Request, res: express.Response) {
    try {
      const payments: Payment[] = await this.paymentService.fetchAllPayments();
      return res.status(200).json(new ServiceResponse(payments, null, true));
    } catch (err) {
      return res
        .status(err.httpErrorCode || 500)
        .json(new ServiceResponse(null, err.message));
    }
  }

  /**
   * Returns a single payment.
   *
   * @param {express.Request} req
   * @param {express.Response} res
   * @returns
   * @memberof PaymentController
   */
  async getSinglePayment(req: express.Request, res: express.Response) {
    try {
      const payment: Payment = await this.paymentService.fetchPayment(
        req.params.id
      );
      if (payment) {
        return res.status(200).json(new ServiceResponse(payment, null, true));
      }
      return res
        .status(404)
        .json(new ServiceResponse(null, "Payment not found"));
    } catch (err) {
      return res
        .status(err.httpErrorCode || 500)
        .json(new ServiceResponse(null, err.message));
    }
  }

  /**
   * Creates routes for payment controller.
   *
   * @returns
   * @memberof PaymentController
   */
  createRoutes() {
    this.route.get(
      "/:id(\\d+)/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getSinglePayment.bind(this)
    );
    this.route.get(
      "/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getAllPayments.bind(this)
    );
    this.route.patch(
      "/:id(\\d+)/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.modifyPayment.bind(this)
    );
    this.route.post(
      "/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.createPayment.bind(this)
    );
    return this.route;
  }
}
