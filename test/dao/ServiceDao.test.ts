process.env.NODE_ENV = "test";

import * as Knex from "knex";
import "mocha";
import ServiceDao from "../../src/dao/ServiceDao";
import { IServiceDatabaseObject } from "../../src/models/Service";

import serviceFile = require("../../seeds/seedData/services");
const dbServices: IServiceDatabaseObject[] = serviceFile as IServiceDatabaseObject[];

import chai = require("chai");
const should: Chai.Should = chai.should();

// Knexfile
const knexfile: any = require("../../knexfile");
// Knex instance
const knex: any = Knex(knexfile.test);

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
    knex.migrate
      .rollback()
      .then(() => {
        done();
      });
  });

  it("Returns all services with all fields", (done: Mocha.Done) => {
    serviceDao
      .findAll()
      .then((services: IServiceDatabaseObject[]) => {
        should.exist(services.length);
        services.length.should.equal(dbServices.length);
        services.forEach((dbService: IServiceDatabaseObject) => {
          const seedService: IServiceDatabaseObject = dbServices.find(
            (seedSrv: IServiceDatabaseObject) =>
              dbService.service_identifier === seedSrv.service_identifier
          );

          should.exist(seedService);

          dbService.service_identifier.should.equal(
            seedService.service_identifier
          );

          dbService.service_name.should.equal(seedService.service_name);

          dbService.redirect_url.should.equal(seedService.redirect_url);

          dbService.id.should.equal(seedService.id);

          dbService.display_name.should.equal(seedService.display_name);

          dbService.data_permissions.should.equal(seedService.data_permissions);
        });

        done();
      })
      .catch((err) => {
        console.error(err);
      });
  });

  it("Removes a service", (done: Mocha.Done) => {
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

  it("Inserts a new service", (done: Mocha.Done) => {
    const newService: IServiceDatabaseObject = {
      data_permissions: 666,
      display_name: "Test service",
      id: 3,
      redirect_url: "https://google.fi",
      service_identifier: "a123b456",
      service_name: "TestServicce"
    };

    serviceDao
      .save(newService)
      .then((res: number[]) => {
        res.length.should.equal(1);
        serviceDao.findAll().then((services: IServiceDatabaseObject[]) => {
          services.length.should.equal(dbServices.length + 1);
          serviceDao
            .findByIdentifier(newService.service_identifier)
            .then((dbService: IServiceDatabaseObject) => {
              Object.keys(dbService).forEach((key: string) => {
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
        Object.keys(dbService).forEach((key: string) => {
          should.exist(dbService[key]);
          dbService[key].should.equal(seedService[key]);
        });
        done();
      })
      .catch((err: any) => {
        console.error(err);
      });
  });
});
