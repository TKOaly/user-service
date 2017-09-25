class ServiceError extends Error {
  constructor(httpErrorCode, message) {
    super(message);
    this.httpErrorCode = httpErrorCode;
  }
}

module.exports = ServiceError;