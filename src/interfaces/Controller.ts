import { Router } from "express";
import { Env } from "../env";

export default interface Controller {
  createRoutes(env: Env): Router;
}
