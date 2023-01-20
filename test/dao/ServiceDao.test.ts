import "mocha";
import ServiceDao from "../../src/dao/ServiceDao";
import { ServiceDatabaseObject } from "../../src/models/Service";
import { knexInstance } from "../../src/Db";

import chai = require("chai");

import serviceFile = require("../../seeds/seedData/services");
process.env.NODE_ENV = "test";

const dbServices = serviceFile as ServiceDatabaseObject[];
const should = chai.should();

// const sleep = (timeout: number) => new Promise((resolve, _reject) => setTimeout(resolve, timeout))

// Knex instance
const knex = knexInstance;

const serviceDao = ServiceDao;

const descending = (a: number, b: number) => b - a;
const nextDbServiceId = dbServices.map(s => s.id).sort(descending)[0] + 1;

describe("ServiceDao", () => {
  // Roll back
  beforeEach(done => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  // After each
  afterEach(done => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  it("Should return all services with findAll()", done => {
    serviceDao.findAll().then(services => {
      should.exist(services.length);
      services.length.should.equal(dbServices.length);
      services.forEach(dbService => {
        const seedService = dbServices.find(seedSrv => dbService.service_identifier === seedSrv.service_identifier);
        if (seedService === undefined) {
          throw new Error("Seeded service not found");
        }

        should.exist(seedService);

        dbService.service_identifier.should.equal(seedService.service_identifier);

        should.exist(dbService.service_name);
        dbService.service_name.should.equal(seedService.service_name);

        should.exist(dbService.redirect_url);
        dbService.redirect_url.should.equal(seedService.redirect_url);

        should.exist(dbService.id);
        dbService.id.should.equal(seedService.id);

        should.exist(dbService.display_name);
        dbService.display_name.should.equal(seedService.display_name);

        should.exist(dbService.data_permissions);
        dbService.data_permissions.should.equal(seedService.data_permissions);

        should.exist(dbService.created);
        should.exist(dbService.modified);
      });

      done();
    });
  });

  it("Should remove a service with remove()", done => {
    serviceDao.remove(dbServices[0].id).then(res => {
      res.should.equal(1);
      serviceDao.findAll().then(services => {
        services.length.should.equal(dbServices.length - 1);
        done();
      });
    });
  });

  it("Should insert a new service with save()", done => {
    const newService: Omit<ServiceDatabaseObject, "created" | "modified"> = {
      data_permissions: 666,
      display_name: "Test service",
      id: nextDbServiceId,
      redirect_url: "https://google.fi",
      service_identifier: "a123b456",
      service_name: "TestServicce",
    };

    serviceDao.save(newService).then(res => {
      should.exist(res);
      res[0].should.equal(nextDbServiceId);
      serviceDao.findAll().then(services => {
        services.length.should.equal(dbServices.length + 1);
        serviceDao.findByIdentifier(newService.service_identifier).then(dbService => {
          if (dbService === undefined) {
            throw new Error("Service not found");
          }
          should.exist(dbService.created);
          should.exist(dbService.modified);
          should.exist(dbService.data_permissions);
          should.exist(dbService.display_name);
          should.exist(dbService.id);
          should.exist(dbService.redirect_url);
          should.exist(dbService.service_identifier);
          should.exist(dbService.service_name);
          dbService.data_permissions.should.equal(newService.data_permissions);
          dbService.display_name.should.equal(newService.display_name);
          dbService.redirect_url.should.equal(newService.redirect_url);
          dbService.service_identifier.should.equal(newService.service_identifier);
          dbService.service_name.should.equal(newService.service_name);
          done();
        });
      });
    });
  });

  it("Should return a single service with findOne()", done => {
    serviceDao.findOne(dbServices[0].id).then(dbService => {
      const seedService = dbServices[0];
      if (dbService === undefined) {
        throw new Error("Service not found");
      }
      // We can't compare modified and created dates
      // @ts-expect-error
      delete dbService.modified;
      // @ts-expect-error
      delete dbService.created; // @ts-expect-error
      Object.keys(dbService).forEach((key: keyof ServiceDatabaseObject) => {
        should.exist(dbService[key]);
        dbService[key].should.equal(seedService[key]);
      });
      done();
    });
  });

  it("Should return a single service with findByIdentifier()", done => {
    // @ts-expect-error
    serviceDao.findByIdentifier(dbServices[0].service_identifier).then((dbService: ServiceDatabaseObject) => {
      const seedService: ServiceDatabaseObject = dbServices[0];
      // We can't compare modified and created dates
      // @ts-expect-error
      delete dbService.modified;
      // @ts-expect-error
      delete dbService.created;

      // @ts-expect-error
      Object.keys(dbService).forEach((key: keyof ServiceDatabaseObject) => {
        should.exist(dbService[key]);
        dbService[key].should.equal(seedService[key]);
      });
      done();
    });
  });

  it("Should update a service with update()", async () => {
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

    should.exist(res);
    res.should.equal(1);

    const service = await serviceDao.findOne(updatedService.id!);

    if (service === undefined) {
      throw new Error("Service not found");
    }

    service.modified.toISOString().should.not.equal(oldService.modified.toISOString());
    service.created.toISOString().should.equal(oldService.created.toISOString());
    service.id.should.equal(updatedService.id);
    service.service_name.should.equal(updatedService.service_name);
    service.data_permissions.should.equal(7768);
  });

  it("should return undefined if service is not found", done => {
    serviceDao.findOne(999).then(service => {
      should.not.exist(service);
      done();
    });
  });
});
