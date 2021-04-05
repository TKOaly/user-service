declare namespace Express {
  export interface Request {
    authorization: {
      user: import("./models/User").default;
      token: import("./token/Token").default;
    };

    session?: {
      user?: import("./controllers/LoginController").ISessionUser;
      loginStep?: import("./middleware/AuthorizeMiddleware").LoginStep;
      /**
       * User requested keys
       */
      keys: Array<{ name: string; value: string }>;
    };
  }
}
