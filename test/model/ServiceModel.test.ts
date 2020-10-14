import "mocha";
import Service from "../../src/models/Service";

process.env.NODE_ENV = "test";
let service: Service;

describe("Service model", () => {
  beforeEach(done => {
    service = new Service({
      id: 1,
      data_permissions: Math.pow(2, 6),
      display_name: "Test service",
      redirect_url: "https://localhost",
      service_identifier: "1-2-3-4-5",
      service_name: "testService",
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
    });
    done();
  });

  it("Sets data correctly", done => {
    service.id.should.equal(1);
    service.dataPermissions.should.equal(Math.pow(2, 6));
    service.displayName.should.equal("Test service");
    service.redirectUrl.should.equal("https://localhost");
    service.serviceIdentifier.should.equal("1-2-3-4-5");
    service.serviceName.should.equal("testService");
    done();
  });

  it("getDatabaseObject() returns a correct object", done => {
    const dbObj = service.getDatabaseObject();
    dbObj.id!.should.equal(service.id);
    dbObj.data_permissions!.should.equal(service.dataPermissions);
    dbObj.display_name!.should.equal(service.displayName);
    dbObj.redirect_url!.should.equal(service.redirectUrl);
    dbObj.service_identifier!.should.equal(service.serviceIdentifier);
    dbObj.service_name!.should.equal(service.serviceName);
    done();
  });
});
