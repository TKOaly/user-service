# TKO-äly authentication microservice

Microservice for authenticating users of members.tko-aly.fi.

## Endpoits

This microservice has two endopoints:

##### `POST /api/auth`

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
    "message": "ok",
    "ok": true,
    "message": "Success",
    "body": {
        "token": "aaaaaaaaabbbbbbbbbbbbbccccccccccccc"
    }
}
```

##### `GET /api/users/me?dataRequest={data request bitfield}`

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

# Future improvements

- Use OAuth2

