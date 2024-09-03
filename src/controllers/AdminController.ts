import { RequestHandler, Router } from "express";
import Controller from "../interfaces/Controller";
import cachingMiddleware from "../utils/CachingMiddleware";
import AuthorizeMiddleware from "../utils/AuthorizeMiddleware";
import ServiceService from "../services/ServiceService";
import moment from "moment";
import { CLAIMS } from "./OAuthController";
import { hasKey } from "../utils/TypescriptHelpers";
import Service from "../models/Service";
import { generateFromIndexes, getChangedClaims, getClaims, permissionsIncludesIndex } from "../utils/Permission";
import PrivacyPolicyService from "../services/PrivacyPolicyService";
import PrivacyPolicy from "../models/PrivacyPolicy";

const mappedPermissions = CLAIMS.map((claims, index) => ({
  index,
  claims: claims.length > 0 ? claims : ["<UNUSED FIELD>"],
}));

const emphasizeUnusedClaims = (claims: string[][]) => {
  return claims.map(claim => {
    if (claim.length === 0) {
      return ["<UNUSED FIELD>"];
    }

    return claim;
  });
};

class AdminController implements Controller {
  public route: Router;

  constructor() {
    this.route = Router();
  }

  callback: RequestHandler = async (req, res) => {
    return res.json({ ok: true });
  };

  services: RequestHandler = async (req, res) => {
    const services = (await ServiceService.fetchAll())
      // Sort by modified date
      .sort((sA, sB) => sA.modifiedAt.getTime() - sB.modifiedAt.getTime())
      // Map to a more readable format
      .map(service => ({
        ...service,
        // Format dates
        createdAt: moment(service.createdAt).format("DD.MM.YYYY HH:mm"),
        modifiedAt: moment(service.modifiedAt).format("DD.MM.YYYY HH:mm"),
      }));

    return res.status(200).render("admin/services", {
      services,
    });
  };
  service: RequestHandler = async (req, res) => {
    const serviceId = req.params.id;
    const service = await ServiceService.fetchById(serviceId);

    if (!service) {
      return res.status(404).render("serviceError", {
        error: "Service not found",
      });
    }

    let privacyPolicy: PrivacyPolicy | undefined = undefined;
    try {
      privacyPolicy = await PrivacyPolicyService.findByServiceIdentifier(service.serviceIdentifier);
    } catch (e) {
      console.error(e);
    }

    return res.status(200).render("admin/service", {
      privacyPolicy: privacyPolicy
        ? {
            ...privacyPolicy,
            createdAt: moment(privacyPolicy?.created).format("DD.MM.YYYY HH:mm"),
            modifiedAt: moment(privacyPolicy?.modified).format("DD.MM.YYYY HH:mm"),
          }
        : undefined,
      service: {
        ...service,
        createdAt: moment(service.createdAt).format("DD.MM.YYYY HH:mm"),
        modifiedAt: moment(service.modifiedAt).format("DD.MM.YYYY HH:mm"),
        permissions: emphasizeUnusedClaims(getClaims(service.dataPermissions)),
      },
    });
  };

  newServiceForm: RequestHandler = async (req, res) => {
    return res.status(200).render("admin/serviceNew", {
      permissions: mappedPermissions,
    });
  };
  createService: RequestHandler = async (req, res) => {
    const permissionsArray = Array.isArray(req.body.permissions ?? [])
      ? (req.body.permissions ?? [])
      : [req.body.permissions];

    const newService = {
      ...req.body,
      permissions: undefined,
      privacyPolicy: undefined,
      dataPermissions: generateFromIndexes(permissionsArray),
    };

    try {
      await ServiceService.create(newService);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return res.status(500).render("serviceError", {
          error: e.message,
        });
      }
      return res.status(500).render("serviceError", {
        error: "Unknown error while saving new service",
      });
    }

    const service = await ServiceService.fetchById(newService.serviceIdentifier);

    if (!service) {
      return res.status(500).render("serviceError", {
        error: "The newly created service was not found in the database",
      });
    }

    try {
      await PrivacyPolicyService.create({
        service_id: service.id,
        text: req.body.privacyPolicy,
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        return res.status(500).render("serviceError", {
          error: e.message,
        });
      }
      return res.status(500).render("serviceError", {
        error: "Unknown error while saving privacy policy for new service",
      });
    }

    return res.status(200).redirect(`/admin/service/${newService.serviceIdentifier}`);
  };

  confirmDelete: RequestHandler = async (req, res) => {
    const serviceId = req.params.id;
    const service = await ServiceService.fetchById(serviceId);

    if (!service) {
      return res.status(404).render("serviceError", {
        error: "Service not found",
      });
    }

    return res.status(200).render("admin/serviceDelete", {
      service,
    });
  };

  deleteService: RequestHandler = async (req, res) => {
    const serviceId = req.params.id;
    const service = await ServiceService.fetchById(serviceId);

    if (!service) {
      return res.status(404).render("serviceError", {
        error: "Service not found",
      });
    }

    try {
      await ServiceService.deleteByIdentifier(serviceId);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return res.status(500).render("serviceError", {
          error: e.message,
        });
      }
      return res.status(500).render("serviceError", {
        error: "Unknown error",
      });
    }

    return res.status(200).redirect("/admin/services");
  };

  editServiceForm: RequestHandler = async (req, res) => {
    const serviceId = req.params.id;
    const service = await ServiceService.fetchById(serviceId);

    if (!service) {
      return res.status(404).render("serviceError", {
        error: "Service not found",
      });
    }

    let privacyPolicy: PrivacyPolicy | undefined = undefined;
    try {
      privacyPolicy = await PrivacyPolicyService.findByServiceIdentifier(service.serviceIdentifier);
    } catch (e) {
      console.error(e);
    }

    return res.status(200).render("admin/serviceEdit", {
      service,
      privacyPolicy,
      permissions: mappedPermissions.map(permission => ({
        ...permission,
        selected: permissionsIncludesIndex(service.dataPermissions, permission.index),
      })),
    });
  };
  confirmChanges: RequestHandler = async (req, res) => {
    const serviceId = req.params.id;
    const service = await ServiceService.fetchById(serviceId);

    if (!service) {
      return res.status(404).render("serviceError", {
        error: "Service not found",
      });
    }

    let privacyPolicy: PrivacyPolicy | undefined = undefined;
    try {
      privacyPolicy = await PrivacyPolicyService.findByServiceIdentifier(service.serviceIdentifier);
    } catch (e) {
      console.error(e);
    }

    const permissionsArray = Array.isArray(req.body.permissions ?? [])
      ? (req.body.permissions ?? [])
      : [req.body.permissions];

    const amendedService = { ...service };
    const newService = {
      ...req.body,
      // Remove the form checkbox -formatted permissions
      permissions: undefined,
      dataPermissions: generateFromIndexes(permissionsArray),
    };

    const changes = Object.keys(newService).reduce(
      (acc, key) => {
        // Empty secret is not a change, keeps the old secret
        if (key === "secret" && newService[key] === "") {
          return acc;
        }

        if (key === "privacyPolicy") {
          return acc;
        }

        if (!hasKey(amendedService, key)) {
          return acc;
        }

        if (newService[key] !== amendedService[key]) {
          acc.push({
            field: key,
            previousValue: amendedService[key],
            newValue: newService[key],
          });
        }

        return acc;
      },
      [] as { field: string; previousValue: unknown; newValue: unknown }[],
    );

    const { added: addedPermissions, removed: removedPermissions } = getChangedClaims(
      service.dataPermissions,
      newService.dataPermissions,
    );

    const privacyPolicyChanged = newService.privacyPolicy !== privacyPolicy?.text;

    if (
      !privacyPolicyChanged &&
      changes.length === 0 &&
      addedPermissions.length === 0 &&
      removedPermissions.length === 0
    ) {
      return res.status(500).render("serviceError", {
        error: "No changes detected",
      });
    }

    return res.status(200).render("admin/serviceDiff", {
      service,
      changes,
      addedPermissions: emphasizeUnusedClaims(addedPermissions),
      removedPermissions: emphasizeUnusedClaims(removedPermissions),
      privacyPolicyChanged,
      oldPrivacyPolicy: privacyPolicy?.text,
      newPrivacyPolicy: newService.privacyPolicy,
      newService,
    });
  };

  updateService: RequestHandler = async (req, res) => {
    const serviceId = req.params.id;
    const service = await ServiceService.fetchById(serviceId);

    if (!service) {
      return res.status(404).render("serviceError", {
        error: "Service not found",
      });
    }

    if (!req.body.newService) {
      return res.status(500).render("serviceError", {
        error: "No new service object provided",
      });
    }

    const newService = JSON.parse(req.body.newService);
    const updatedService = Service.createUpdatedService(service, newService);

    try {
      await ServiceService.update(updatedService);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return res.status(500).render("serviceError", {
          error: e.message,
        });
      }
      return res.status(500).render("serviceError", {
        error: "Unknown error while updating the service",
      });
    }

    if (newService.privacyPolicy) {
      let privacyPolicy: PrivacyPolicy | undefined = undefined;
      try {
        privacyPolicy = await PrivacyPolicyService.findByServiceIdentifier(service.serviceIdentifier);
      } catch (e) {
        console.error(e);
      }

      if (!privacyPolicy) {
        try {
          await PrivacyPolicyService.create({
            service_id: service.id,
            text: newService.privacyPolicy,
          });
        } catch (e: unknown) {
          if (e instanceof Error) {
            return res.status(500).render("serviceError", {
              error: e.message,
            });
          }

          return res.status(500).render("serviceError", {
            error: "Unknown error while creating a privacy policy",
          });
        }
      } else {
        try {
          await PrivacyPolicyService.update(privacyPolicy.id, {
            service_id: privacyPolicy.service_id,
            text: newService.privacyPolicy,
          });
        } catch (e: unknown) {
          if (e instanceof Error) {
            return res.status(500).render("serviceError", {
              error: e.message,
            });
          }

          return res.status(500).render("serviceError", {
            error: "Unknown error while updating the privacy policy",
          });
        }
      }
    }

    return res.status(200).redirect(`/admin/service/${serviceId}`);
  };

  public createRoutes(): Router {
    this.route.get("/", cachingMiddleware, AuthorizeMiddleware.loadToken, async (req, res) => {
      return res.json({ ok: true });
    });

    this.route.get("/callback", cachingMiddleware, this.callback);

    this.route.get("/services", cachingMiddleware, this.services);
    this.route.get("/services/new", cachingMiddleware, this.newServiceForm);
    this.route.post("/services/new", cachingMiddleware, this.createService);

    this.route.get("/service/:id", cachingMiddleware, this.service);

    this.route.get("/service/:id/edit/", cachingMiddleware, this.editServiceForm);
    this.route.post("/service/:id/edit/", cachingMiddleware, this.confirmChanges);
    this.route.post("/service/:id/edit/confirm", cachingMiddleware, this.updateService);

    this.route.get("/service/:id/delete", cachingMiddleware, this.confirmDelete);
    this.route.post("/service/:id/delete", cachingMiddleware, this.deleteService);

    return this.route;
  }
}

export default new AdminController();
