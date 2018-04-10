"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha1 = require("sha1");
const jwt = require("jsonwebtoken");
const User_1 = require("../models/User");
const ServiceError_1 = require("../utils/ServiceError");
class AuthenticationService {
    constructor(knex) {
        this.knex = knex;
        this.knex = knex;
    }
    fetchToken(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let userArray = yield this.knex.select('users.*').from('users').where({ username }).limit(1);
            if (!userArray.length) {
                throw new ServiceError_1.default(404, 'User not found');
            }
            let user = new User_1.default(userArray[0]);
            let hashedPassword = generateHashWithPasswordAndSalt(password, user.salt);
            if (hashedPassword === user.hashedPassword) {
                return jwt.sign({
                    userId: user.id,
                    createdAt: Date.now()
                }, process.env.AUTHSERVICE_JWT_SECRET);
            }
            else
                throw new ServiceError_1.default(403, 'Password or username doesn\'t match');
        });
    }
    verifyToken(token) {
        let parsedToken = jwt.verify(token, process.env.AUTHSERVICE_JWT_SECRET);
        return {
            userId: parsedToken.userId,
            createdAt: new Date(parsedToken.createdAt)
        };
    }
}
exports.default = AuthenticationService;
;
function generateHashWithPasswordAndSalt(password, salt) {
    return sha1(`${salt}kekbUr${password}`);
}
//# sourceMappingURL=AuthenticationService.js.map