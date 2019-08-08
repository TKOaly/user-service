import * as express from "express";
import Raven from "raven";
import UserRoleString from "../enum/UserRoleString";
import IController from "../interfaces/IController";
import Payment from "../models/Payment";
import { PaymentListing } from "../models/PaymentListing";
import PaymentService from "../services/PaymentService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";
import PaymentValidator from "../validators/PaymentValidator";

export default class PaymentController implements IController {
  private route: express.Router;
  private authorizeMiddleware: AuthorizeMiddleware;
  private paymentValidator: PaymentValidator;

  constructor(private userService: UserService, private paymentService: PaymentService) {
    this.route = express.Router();
    this.paymentValidator = new PaymentValidator();
    this.authorizeMiddleware = new AuthorizeMiddleware(this.userService);
  }

  public async createPayment(req: express.Request, res: express.Response): Promise<express.Response> {
    try {
      this.paymentValidator.validateCreate(req.body);
      const paymentIds: number[] = await this.paymentService.createPayment(req.body);
      const payment: Payment = await this.paymentService.fetchPayment(paymentIds[0]);
      if (payment.payment_type === "tilisiirto") {
        payment.generateReferenceNumber();
        // Set the generated reference number
        await this.paymentService.updatePayment(payment.id, payment);
      }
      return res.status(201).json(new ServiceResponse(payment, "Payment created", true));
    } catch (err) {
      Raven.captureBreadcrumb({
        message: "Error creating payment",
        errorMessage: err.message,
      });
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async modifyPayment(req: express.Request, res: express.Response): Promise<express.Response> {
    try {
      // PATCH request requires the whole object to be passed
      if (
        !(
          req.body.id &&
          req.body.payer_id &&
          req.body.confirmer_id &&
          req.body.created &&
          req.body.reference_number &&
          req.body.amount &&
          req.body.valid_until &&
          req.body.paid &&
          req.body.payment_type &&
          req.body.membership_applied_for
        )
      ) {
        return res
          .status(400)
          .json(new ServiceResponse(null, "Failed to modify payment: missing request parameters", false));
      }

      const affectedRow: number = await this.paymentService.updatePayment(req.params.id, req.body);
      if (affectedRow === 1) {
        const updatedPayment: Payment = await this.paymentService.fetchPayment(req.params.id);
        return res.status(200).json(new ServiceResponse(updatedPayment, "Payment modified", true));
      } else {
        return res.status(400).json(new ServiceResponse(null, "Failed to modify payment"));
      }
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async getAllPayments(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    let payments: Payment[] | PaymentListing[] = null;

    try {
      switch (req.query.filter) {
        case "unpaid":
          payments = await this.paymentService.fetchUnpaidPayments();
          break;
        case "bankPaid":
          payments = await this.paymentService.findPaymentsPaidByBankTransfer();
          break;
        case "cashPaid":
          payments = await this.paymentService.findPaymentsPaidByCash();
          break;
        default:
          payments = await this.paymentService.fetchAllPayments();
      }
      return res.status(200).json(new ServiceResponse(payments, null, true));
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async getSinglePayment(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    try {
      const payment: Payment = await this.paymentService.fetchPayment(req.params.id);

      if (
        payment.payer_id !== req.authorization.user.id &&
        compareRoles(req.authorization.user.role, UserRoleString.Yllapitaja) < 0
      ) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      }
      if (payment) {
        return res.status(200).json(new ServiceResponse(payment, null, true));
      }
      return res.status(404).json(new ServiceResponse(null, "Payment not found"));
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async markPaymentAsPaid(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      if (req.params.method === "bank") {
        await this.paymentService.makeBankPaid(req.params.id, req.authorization.user.id);
        return res.status(200).json(new ServiceResponse(null, "Success"));
      } else if (req.params.method === "cash") {
        await this.paymentService.makeCashPaid(req.params.id, req.authorization.user.id);
        return res.status(200).json(new ServiceResponse(null, "Success"));
      } else {
        return res.status(304);
      }
    } catch (e) {
      Raven.captureBreadcrumb({
        message: "Error marking payment as paid",
        data: {
          paymentId: req.params.id,
          paymentMethod: req.params.method,
          paymentMarkedByUserId: req.authorization.user.id,
        },
      });
      res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
      Raven.captureException(e);
    }
  }

  public async deletePayment(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      await this.paymentService.deletePatyment(Number(req.params.id));
      return res.status(200);
    } catch (e) {
      Raven.captureBreadcrumb({
        message: "Error deleting payment",
        errorMessage: e.message,
        data: {
          paymentId: req.params.id,
        },
      });
      res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
      Raven.captureException(e);
    }
  }

  public createRoutes(): express.Router {
    this.route.get(
      "/:id(\\d+)/",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.getSinglePayment.bind(this),
    );
    this.route.get(
      "/",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.getAllPayments.bind(this),
    );
    this.route.patch(
      "/:id(\\d+)/",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.modifyPayment.bind(this),
    );
    this.route.put(
      "/:id(\\d+)/pay/:method",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.markPaymentAsPaid.bind(this),
    );
    this.route.delete(
      "/:id(\\d+)",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.deletePayment.bind(this),
    );
    this.route.post(
      "/",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.createPayment.bind(this),
    );
    return this.route;
  }
}
