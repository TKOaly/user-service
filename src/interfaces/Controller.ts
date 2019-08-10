import { Router } from "express";

export default interface Controller {
  createRoutes(): Router;
}
