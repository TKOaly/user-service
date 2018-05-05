# TKO-äly user service

Microservice for authenticating users of members.tko-aly.fi.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Endpoints](#endpoints)
  - [`POST /api/auth`](#post-apiauth)
  - [`GET /api/users/me?dataRequest={data request bitfield}`](#get-apiusersmedatarequestdata-request-bitfield)
- [Future improvements](#future-improvements)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Endpoints

This microservice has two endopoints:

### `POST /api/auth`

Authenticates a user with username and password. It returns a authorization token which can be used to fetch user information.

Example of POST body:

```json
{
  "username": "hugeli",
  "password": "1234"
}
```

Example of response:

```json
{
  "ok": true,
  "message": "Success",
  "body": {
    "token": "aaaaaaaaabbbbbbbbbbbbbccccccccccccc"
  }
}
```

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

## Future improvements

* Use OAuth2
