import * as express from "express";

export default interface IController {
  /**
   * Creates routes for the controller.
   */
  createRoutes(): express.Router;
}
