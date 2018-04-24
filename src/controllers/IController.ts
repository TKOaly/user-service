import * as express from 'express';

export interface IController {
  createRoutes(): express.Router;
}