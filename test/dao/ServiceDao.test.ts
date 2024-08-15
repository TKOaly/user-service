import { describe, test, beforeEach, afterEach, expect } from "vitest";
import ServiceDao from "../../src/dao/ServiceDao";
import { ServiceDatabaseObject } from "../../src/models/Service";
import { knexInstance } from "../../src/Db";

import serviceFile from "../../seeds/seedData/services";
process.env.NODE_ENV = "test";

const dbServices = serviceFile as ServiceDatabaseObject[];

// Knex instance
const knex = knexInstance;

const serviceDao = ServiceDao;

const descending = (a: number, b: number) => b - a;
const nextDbServiceId = dbServices.map(s => s.id).sort(descending)[0] + 1;

describe("ServiceDao", () => {
  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  // After each
  afterEach(async () => {
    await knex.migrate.rollback();
  });

  test("Should return all services with findAll()", async () => {
    const services = await serviceDao.findAll();
    expect(services.length).toBeDefined();
    expect(services.length).to.equal(dbServices.length);
    services.forEach(dbService => {
      const seedService = dbServices.find(seedSrv => dbService.service_identifier === seedSrv.service_identifier);
      if (seedService === undefined) {
        throw new Error("Seeded service not found");
      }

      expect(seedService).toBeDefined();

      expect(dbService.service_identifier).to.equal(seedService.service_identifier);

      expect(dbService.service_name).toBeDefined();
      expect(dbService.service_name).to.equal(seedService.service_name);

      expect(dbService.redirect_url).toBeDefined();
      expect(dbService.redirect_url).to.equal(seedService.redirect_url);

      expect(dbService.id).toBeDefined();
      expect(dbService.id).to.equal(seedService.id);

      expect(dbService.display_name).toBeDefined();
      expect(dbService.display_name).to.equal(seedService.display_name);

      expect(dbService.data_permissions).toBeDefined();
      expect(dbService.data_permissions).to.equal(seedService.data_permissions);

      expect(dbService.created).toBeDefined();
      expect(dbService.modified).toBeDefined();
    });
  });

  test("Should remove a service with remove()", async () => {
    const res = await serviceDao.remove(dbServices[0].id);
    expect(res).to.equal(1);
    const services = await serviceDao.findAll();
    expect(services.length).to.equal(dbServices.length - 1);
  });

  test("Should insert a new service with save()", async () => {
    const newService: Omit<ServiceDatabaseObject, "created" | "modified"> = {
      data_permissions: 666,
      display_name: "Test service",
      id: nextDbServiceId,
      redirect_url: "https://google.fi",
      service_identifier: "a123b456",
      service_name: "TestServicce",
      secret: "unsecure",
    };

    const res = await serviceDao.save(newService);
    expect(res).toBeDefined();
    expect(res[0]).to.equal(nextDbServiceId);
    const services = await serviceDao.findAll();
    expect(services.length).to.equal(dbServices.length + 1);
    const dbService = await serviceDao.findByIdentifier(newService.service_identifier);
    if (dbService === undefined) {
      throw new Error("Service not found");
    }
    expect(dbService.created).toBeDefined();
    expect(dbService.modified).toBeDefined();
    expect(dbService.data_permissions).toBeDefined();
    expect(dbService.display_name).toBeDefined();
    expect(dbService.id).toBeDefined();
    expect(dbService.redirect_url).toBeDefined();
    expect(dbService.service_identifier).toBeDefined();
    expect(dbService.service_name).toBeDefined();
    expect(dbService.data_permissions).to.equal(newService.data_permissions);
    expect(dbService.display_name).to.equal(newService.display_name);
    expect(dbService.redirect_url).to.equal(newService.redirect_url);
    expect(dbService.service_identifier).to.equal(newService.service_identifier);
    expect(dbService.service_name).to.equal(newService.service_name);
  });

  test("Should return a single service with findOne()", async () => {
    const seedService = dbServices[0];

    const dbService = await serviceDao.findOne(seedService.id);

    if (dbService === undefined) {
      throw new Error("Service not found");
    }

    Object.keys(dbService).forEach(key => {
      if (["modified", "created"].includes(key)) {
        // We can't compare modified and created dates
        return;
      }

      expect(dbService[key]).toBeDefined();
      expect(dbService[key]).to.equal(seedService[key]);
    });
  });

  test("Should return a single service with findByIdentifier()", async () => {
    const seedService = dbServices[0];

    const dbService = await serviceDao.findByIdentifier(seedService.service_identifier);

    if (dbService === undefined) {
      throw new Error("Service not found");
    }

    Object.keys(dbService).forEach(key => {
      if (["modified", "created"].includes(key)) {
        // We can't compare modified and created dates
        return;
      }

      expect(dbService[key]).toBeDefined();
      expect(dbService[key]).to.equal(seedService[key]);
    });
  });

  test("Should update a service with update()", async () => {
    const updatedService: Pick<ServiceDatabaseObject, "id" | "service_name" | "data_permissions"> = {
      id: 2,
      service_name: "test_service",
      data_permissions: 7768,
    };

    const oldService = await serviceDao.findOne(updatedService.id);

    if (oldService === undefined) {
      throw new Error("Service not found");
    }

    // await sleep(2000)

    const res = await serviceDao.update(updatedService.id, updatedService);

    expect(res).toBeDefined();
    expect(res).to.equal(1);

    const service = await serviceDao.findOne(updatedService.id!);

    if (service === undefined) {
      throw new Error("Service not found");
    }

    expect(service.modified.toISOString()).not.to.equal(oldService.modified.toISOString());
    expect(service.created.toISOString()).to.equal(oldService.created.toISOString());
    expect(service.id).to.equal(updatedService.id);
    expect(service.service_name).to.equal(updatedService.service_name);
    expect(service.data_permissions).to.equal(7768);
  });

  test("should return undefined if service is not found", async () => {
    const service = await serviceDao.findOne(999);
    expect(service).not.toBeDefined();
  });
});
