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
    "body": {
        "value": "aaaaaaaaabbbbbbbbbbbbbccccccccccccc",
        "expiresAt": "2018-02-24T11:56:27.017Z",
        "ownerId": "userID"
    }
}
```

##### `GET /api/users/me`

Example response:

```json
{
    "message": "ok",
    "body": {
        "id": "userId",
        "username": "hugeli",
        "name": "Hugo Holmqvist",
        "screenName": "Paska jäbä",
        "email": "hugeli@spam.com",
        "residence": "Helsinki",
        "phone": "58493508",
        "isHYYMember": true,
        "membership": "member",
        "role": "yllapitaja",
        "createdAt": "2018-02-24T11:56:27.017Z",
        "modifiedAt": "2018-02-24T11:56:27.017Z",
        "isTKTL": true,
        "isDeleted": false
    }
}
```

# Future improvements

- Use OAuth2 

