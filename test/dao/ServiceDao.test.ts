process.env.NODE_ENV = "test";

import chai = require("chai");
import Knex from "knex";
import "mocha";
// Knexfile
import * as knexfile from "../../knexfile";
import serviceFile = require("../../seeds/seedData/services");
import ServiceDao from "../../src/dao/ServiceDao";
import { IServiceDatabaseObject } from "../../src/models/Service";

const dbServices: IServiceDatabaseObject[] = serviceFile as IServiceDatabaseObject[];
const should: Chai.Should = chai.should();

// Knex instance
const knex: Knex = Knex(knexfile.test);

const serviceDao: ServiceDao = new ServiceDao(knex);

describe("ServiceDao", () => {
  // Roll back
  beforeEach((done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  // After each
  afterEach((done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  it("Returns all services with findAll()", (done: Mocha.Done) => {
    serviceDao
      .findAll()
      .then((services: IServiceDatabaseObject[]) => {
        should.exist(services.length);
        services.length.should.equal(dbServices.length);
        services.forEach((dbService: IServiceDatabaseObject) => {
          const seedService: IServiceDatabaseObject = dbServices.find(
            (seedSrv: IServiceDatabaseObject) => dbService.service_identifier === seedSrv.service_identifier,
          );

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
      })
      .catch(err => {
        console.error(err);
      });
  });

  it("Removes a service with remove()", (done: Mocha.Done) => {
    serviceDao
      .remove(dbServices[0].id)
      .then((res: boolean) => {
        res.should.equal(1);
        serviceDao.findAll().then((services: IServiceDatabaseObject[]) => {
          services.length.should.equal(dbServices.length - 1);
          done();
        });
      })
      .catch((err: any) => {
        console.error(err);
      });
  });

  it("Inserts a new service with save()", (done: Mocha.Done) => {
    const newService: IServiceDatabaseObject = {
      data_permissions: 666,
      display_name: "Test service",
      id: 5,
      redirect_url: "https://google.fi",
      service_identifier: "a123b456",
      service_name: "TestServicce",
    };

    serviceDao
      .save(newService)
      .then((res: number[]) => {
        should.exist(res);
        res[0].should.equal(5);
        serviceDao.findAll().then((services: IServiceDatabaseObject[]) => {
          services.length.should.equal(dbServices.length + 1);
          serviceDao.findByIdentifier(newService.service_identifier).then((dbService: IServiceDatabaseObject) => {
            delete newService.id;
            delete newService.modified;
            delete newService.created;
            delete dbService.modified;
            delete dbService.created;
            Object.keys(newService).forEach((key: keyof IServiceDatabaseObject) => {
              should.exist(dbService[key]);
              dbService[key].should.equal(newService[key]);
            });
            done();
          });
        });
      })
      .catch((err: any) => {
        console.error(err);
      });
  });

  it("Returns a single service with findOne()", (done: Mocha.Done) => {
    serviceDao
      .findOne(dbServices[0].id)
      .then((dbService: IServiceDatabaseObject) => {
        const seedService: IServiceDatabaseObject = dbServices[0];
        // We can't compare modified and created dates
        delete dbService.modified;
        delete dbService.created;
        Object.keys(dbService).forEach((key: keyof IServiceDatabaseObject) => {
          should.exist(dbService[key]);
          dbService[key].should.equal(seedService[key]);
        });
        done();
      })
      .catch((err: any) => {
        console.error(err);
      });
  });

  it("Returns a single service with findByIdentifier()", (done: Mocha.Done) => {
    serviceDao
      .findByIdentifier(dbServices[0].service_identifier)
      .then((dbService: IServiceDatabaseObject) => {
        const seedService: IServiceDatabaseObject = dbServices[0];
        // We can't compare modified and created dates
        delete dbService.modified;
        delete dbService.created;

        Object.keys(dbService).forEach((key: keyof IServiceDatabaseObject) => {
          should.exist(dbService[key]);
          dbService[key].should.equal(seedService[key]);
        });
        done();
      })
      .catch((err: any) => {
        console.error(err);
      });
  });

  it("Updates a new service with update()", (done: Mocha.Done) => {
    const updatedService: IServiceDatabaseObject = {
      id: 2,
      service_name: "test_service",
      data_permissions: 7768,
    };
    serviceDao.findOne(updatedService.id).then((oldService: IServiceDatabaseObject) => {
      new Promise(r => setTimeout(r, 4000)).then(() => {
        serviceDao
          .update(updatedService.id, updatedService)
          .then((res: number) => {
            should.exist(res);
            res.should.equal(1);
            serviceDao.findOne(updatedService.id).then((service: IServiceDatabaseObject) => {
              service.modified.toISOString().should.not.equal(oldService.modified.toISOString());
              service.created.toISOString().should.equal(oldService.created.toISOString());
              service.id.should.equal(updatedService.id);
              service.service_name.should.equal(updatedService.service_name);
              service.data_permissions.should.equal(7768);
              done();
            });
          })
          .catch((err: any) => {
            console.error(err);
          });
      });
    });
  });
});
