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
const ServiceError_1 = require("../utils/ServiceError");
const User_1 = require("../models/User");
class UserService {
    constructor(knex) {
        this.knex = knex;
        this.knex = knex;
    }
    fetchUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.knex.select('*').from('users').where({ id: userId }).limit(1);
            if (!result.length) {
                throw new ServiceError_1.default(404, 'Not found');
            }
            let user = new User_1.default(result[0]);
            return user;
        });
    }
}
exports.default = UserService;
//# sourceMappingURL=UserService.js.map