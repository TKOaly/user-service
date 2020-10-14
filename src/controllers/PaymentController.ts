import * as express from "express";
import Raven from "raven";
import UserRoleString from "../enum/UserRoleString";
import Controller from "../interfaces/Controller";
import Payment from "../models/Payment";
import { PaymentListing } from "../models/PaymentListing";
import PaymentService from "../services/PaymentService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";
import PaymentValidator from "../validators/PaymentValidator";

class PaymentController implements Controller {
  private route: express.Router;
  private paymentValidator: PaymentValidator;

  constructor() {
    this.route = express.Router();
    this.paymentValidator = new PaymentValidator();
  }

  public async createPayment(req: express.Request, res: express.Response): Promise<express.Response> {
    try {
      this.paymentValidator.validateCreate(req.body);
      const paymentIds = await PaymentService.createPayment(req.body);
      const payment = await PaymentService.fetchPayment(paymentIds[0]);
      if (payment.payment_type === "tilisiirto") {
        payment.generateReferenceNumber();
        // Set the generated reference number
        await PaymentService.updatePayment(payment.id, payment);
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

      const affectedRow: number = await PaymentService.updatePayment(Number(Number(req.params.id)), req.body);
      if (affectedRow === 1) {
        const updatedPayment: Payment = await PaymentService.fetchPayment(Number(req.params.id));
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

    let payments: Payment[] | PaymentListing[] | null = null;

    try {
      switch (req.query.filter) {
        case "unpaid":
          payments = await PaymentService.fetchUnpaidPayments();
          break;
        case "bankPaid":
          payments = await PaymentService.findPaymentsPaidByBankTransfer();
          break;
        case "cashPaid":
          payments = await PaymentService.findPaymentsPaidByCash();
          break;
        default:
          payments = await PaymentService.fetchAllPayments();
      }
      return res.status(200).json(new ServiceResponse(payments, null, true));
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async getSinglePayment(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    try {
      const payment: Payment = await PaymentService.fetchPayment(Number(req.params.id));

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
        await PaymentService.makeBankPaid(Number(req.params.id), req.authorization.user.id);
        return res.status(200).json(new ServiceResponse(null, "Success"));
      } else if (req.params.method === "cash") {
        await PaymentService.makeCashPaid(Number(req.params.id), req.authorization.user.id);
        return res.status(200).json(new ServiceResponse(null, "Success"));
      } else {
        return res.status(304);
      }
    } catch (e) {
      Raven.captureBreadcrumb({
        message: "Error marking payment as paid",
        data: {
          paymentId: Number(req.params.id),
          paymentMethod: req.params.method,
          paymentMarkedByUserId: req.authorization.user.id,
        },
      });
      Raven.captureException(e);
      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  }

  public async deletePayment(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      await PaymentService.deletePatyment(Number(Number(req.params.id)));
      return res.status(200);
    } catch (e) {
      Raven.captureBreadcrumb({
        message: "Error deleting payment",
        errorMessage: e.message,
        data: {
          paymentId: Number(req.params.id),
        },
      });
      Raven.captureException(e);
      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  }

  public createRoutes(): express.Router {
    this.route.get(
      "/:id(\\d+)/", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.getSinglePayment.bind(this),
    ); // @ts-expect-error
    this.route.get("/", AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware), this.getAllPayments.bind(this));
    this.route.patch(
      "/:id(\\d+)/", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.modifyPayment.bind(this),
    );
    this.route.put(
      "/:id(\\d+)/pay/:method", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.markPaymentAsPaid.bind(this),
    );
    this.route.delete(
      "/:id(\\d+)", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.deletePayment.bind(this),
    ); // @ts-expect-error
    this.route.post("/", AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware), this.createPayment.bind(this));
    return this.route;
  }
}

export default new PaymentController();
