# TKO-äly user service

Microservice for authenticating users of members.tko-aly.fi.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation instructions](#installation-instructions)
- [Endpoints](#endpoints)
  - [`GET /?serviceIdentifier={service identifier}`](#get-serviceidentifierservice-identifier)
  - [`POST /api/auth/requestPermissions`](#post-apiauthrequestpermissions)
  - [`GET /api/users/me?dataRequest={data request bitfield}`](#get-apiusersmedatarequestdata-request-bitfield)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation instructions

1.  Clone the repo
2.  Run `yarn install`
3.  Copy `.env.example` to `.env` and set environment variables
4.  Run `yarn test`to run tests
5.  Run `yarn start` or `yarn watch``

## Endpoints

### `GET /?serviceIdentifier={service identifier}`

Shows the user a login form, that authenticates to a service identified by the service identifier.

If the user is already authenticated to the service, the form will redirect the user to the service specified.

![Login page](img/login_page.png)
![Permission page](img/permission.png)

### `POST /api/auth/requestPermissions`

Authenticates a user with username, password and a service identifier. It returns a authorization token which can be used to fetch user information.

Example of form POST body:

```json
{
  "username": "hugeli",
  "password": "1234",
  "serviceIdentifier": "12a0058d-f9aa-1e22-b01a-6025700dab1f"
}
```

The response of this request is a form verifying what user information is used in that service (services are identified by an unique service idenfitier.)

### `GET /api/users/me?dataRequest={data request bitfield}`

The `dataRequest` query parameter is required. It is a bitfield which values are 2 ^ the [User](/src/models/User.ts) model's attribute index.

If I wan't to get the id, name and email of a user, I do `Math.pow(2, 0) | Math.pow(2, 2) | Math.pow(2, 4)`, then insert that value into the dataRequest query. It would return:

Example response:

```json
{
  "ok": true,
  "message": "Success",
  "payload": {
    "id": 420,
    "name": "Bob John",
    "email": "asd@asd.com"
  }
}
```
