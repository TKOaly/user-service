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
const express = require("express");
class UserController {
    constructor(userService, authenticationService) {
        this.userService = userService;
        this.authenticationService = authenticationService;
        this.route = express.Router();
    }
    getMe(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let token = req.headers['authorization'];
            if (!token || !token.toString().startsWith('Bearer ')) {
                return res.status(401).json({
                    message: 'Unauthorized'
                });
            }
            try {
                let tokenPayload = this.authenticationService.verifyToken(token.toString().substring(7));
                let user = yield this.userService.fetchUser(tokenPayload.userId);
                res.status(200).json({
                    message: 'Success',
                    payload: user.removeSensitiveInformation()
                });
            }
            catch (e) {
                res.status(e.httpErrorCode).json({
                    message: e.message
                });
            }
        });
    }
    createRoutes() {
        this.route.get('/me', this.getMe.bind(this));
        return this.route;
    }
}
exports.default = UserController;
//# sourceMappingURL=UserController.js.map