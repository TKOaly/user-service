class Token {
  constructor(tokenDatabaseObject) {
    this.value = tokenDatabaseObject.value;
    this.expiresAt = tokenDatabaseObject.expiresAt;
    this.ownerId = tokenDatabaseObject.ownerId
  }
}

module.exports = Token;