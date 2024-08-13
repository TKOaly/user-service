import { describe, beforeEach, test, expect } from "vitest";
import Service from "../../src/models/Service";

process.env.NODE_ENV = "test";
let service: Service;

describe("Service model", () => {
  beforeEach(() => {
    service = new Service({
      id: 1,
      data_permissions: Math.pow(2, 6),
      display_name: "Test service",
      redirect_url: "https://localhost",
      service_identifier: "1-2-3-4-5",
      service_name: "testService",
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      secret: "unsecure",
    });
  });

  test("Sets data correctly", () => {
    expect(service).toMatchObject({
      id: 1,
      dataPermissions: Math.pow(2, 6),
      displayName: "Test service",
      redirectUrl: "https://localhost",
      serviceIdentifier: "1-2-3-4-5",
      serviceName: "testService",
    });
  });

  test("getDatabaseObject() returns a correct object", () => {
    const dbObj = service.getDatabaseObject();

    expect(dbObj).toMatchObject({
      id: service.id,
      data_permissions: service.dataPermissions,
      display_name: service.displayName,
      redirect_url: service.redirectUrl,
      service_identifier: service.serviceIdentifier,
      service_name: service.serviceName,
    });
  });
});
