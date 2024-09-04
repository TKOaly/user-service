import * as express from "express";
import { RequestHandler } from "express";
import * as Sentry from "@sentry/node";
import UserRoleString from "../enum/UserRoleString";
import Controller from "../interfaces/Controller";
import Payment from "../models/Payment";
import { PaymentListing } from "../models/PaymentListing";
import PaymentService from "../services/PaymentService";
import AuthorizeMiddleware, { AuthorizedRequestHandler } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";
import PaymentValidator from "../validators/PaymentValidator";
import PricingService from "../services/PricingService";
import ServiceError from "../utils/ServiceError";

class PaymentController implements Controller {
  private route: express.Router;
  private paymentValidator: PaymentValidator;

  constructor() {
    this.route = express.Router();
    this.paymentValidator = new PaymentValidator();
  }

  createPayment: AuthorizedRequestHandler = async (req, res) => {
    try {
      const endSeason = await PricingService.getSeasonInfo(PricingService.getSeason(req.body.seasons - 1));
      const [price] = await PricingService.findPricings("current", req.body.membership_applied_for, req.body.seasons);

      const newPayment = {
        ...req.body,
        valid_until: endSeason.end,
        amount: price.price,
      };

      delete newPayment.seasons;

      this.paymentValidator.validateCreate(newPayment);
      const paymentIds = await PaymentService.createPayment(newPayment);
      let payment = await PaymentService.fetchPayment(paymentIds[0]);
      if (payment.payment_type === "tilisiirto") {
        payment.generateReferenceNumber();
        // Set the generated reference number
        await PaymentService.updatePayment(payment.id, payment);
        payment = await PaymentService.fetchPayment(paymentIds[0]);
      }
      return res.status(201).json(new ServiceResponse(payment, "Payment created", true));
    } catch (err) {
      if (err instanceof Error) {
        Sentry.addBreadcrumb({
          message: "Error creating payment",
          data: {
            errorMessage: err.message,
          },
        });
      }

      if (err instanceof ServiceError) {
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }

      throw err;
    }
  };

  modifyPayment: AuthorizedRequestHandler = async (req, res) => {
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
      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  getAllPayments: AuthorizedRequestHandler = async (req, res) => {
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
      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  getSinglePayment: AuthorizedRequestHandler = async (req, res) => {
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
      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  markPaymentAsPaid: AuthorizedRequestHandler = async (req, res) => {
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
        return res.status(400);
      }
    } catch (e) {
      Sentry.addBreadcrumb({
        message: "Error marking payment as paid",
        data: {
          paymentId: Number(req.params.id),
          paymentMethod: req.params.method,
          paymentMarkedByUserId: req.authorization.user.id,
        },
      });
      Sentry.captureException(e);

      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  };

  deletePayment: AuthorizedRequestHandler = async (req, res) => {
    if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      await PaymentService.deletePatyment(Number(Number(req.params.id)));
      return res.status(200);
    } catch (e) {
      if (e instanceof Error) {
        Sentry.addBreadcrumb({
          message: "Error deleting payment",
          data: {
            paymentId: Number(req.params.id),
            errorMessage: e.message,
          },
        });
      }

      Sentry.captureException(e);

      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  };

  getPaymentByReferenceNumber: AuthorizedRequestHandler = async (req, res) => {
    if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    const referenceNumber = req.params.rf;

    try {
      const payment = await PaymentService.fetchPaymentByReferenceNumber(referenceNumber);
      res.status(200).json(new ServiceResponse(payment));
    } catch (err) {
      if (err instanceof ServiceError) {
        res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
        return;
      }

      throw err;
    }
  };

  public createRoutes(): express.Router {
    this.route.use(AuthorizeMiddleware.authorize(true));

    this.route.get("/:id(\\d+)/", this.getSinglePayment as RequestHandler);
    this.route.get("/", this.getAllPayments as RequestHandler);
    this.route.patch("/:id(\\d+)/", this.modifyPayment as RequestHandler);
    this.route.put("/:id(\\d+)/pay/:method", this.markPaymentAsPaid as RequestHandler);
    this.route.delete("/:id(\\d+)", this.deletePayment as RequestHandler);
    this.route.post("/", this.createPayment as RequestHandler);
    this.route.get("/by-reference-number/:rf(\\d+)", this.getPaymentByReferenceNumber as RequestHandler);

    return this.route;
  }
}

export default new PaymentController();
