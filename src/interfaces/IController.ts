import * as express from "express";

export default interface IController {
  createRoutes(): express.Router;
}
