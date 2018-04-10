"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServiceError extends Error {
    constructor(httpErrorCode, message) {
        super(message);
        this.httpErrorCode = httpErrorCode;
    }
}
exports.default = ServiceError;
module.exports = ServiceError;
//# sourceMappingURL=ServiceError.js.map