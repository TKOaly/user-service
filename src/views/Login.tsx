import React from "react";
import { t } from ".";
import Service from "../models/Service";

interface Props {
  service: Service;
}

const Login: React.SFC<Props> = props => (
  <html lang="en">
    <head>
      <title>
        {t("login_Login_to")} {props.service.displayName}
      </title>
      <link rel="stylesheet" href="/reset.css" />
      <link rel="stylesheet" href="/common.css" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <div id="container">
        <div id="menubar">
          <div id="logo-container">
            <img className="img" src="/svg/tkoaly.svg" />
          </div>
          <div id="title-container">
            <div id="title">
              {t("login_Login")} to {props.service.displayName}
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
);

export default Login;
