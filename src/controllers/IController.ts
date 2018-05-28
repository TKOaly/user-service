import * as express from "express";

/**
 * IController interface.
 *
 * @export
 * @interface IController
 */
export interface IController {
  /**
   * Creates routes for the controller.
   *
   * @returns {express.Router}
   * @memberof IController
   */
  createRoutes(): express.Router;
}
