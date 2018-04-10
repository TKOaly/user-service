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
class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.route = express.Router();
    }
    authenticate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = req.body;
            if (!body.username && !body.password) {
                return res.status(400).json({
                    message: 'Invalid POST params'
                });
            }
            try {
                let token = yield this.authService.fetchToken(body.username, body.password);
                res.status(200).json({
                    message: 'Success',
                    payload: {
                        token
                    }
                });
            }
            catch (exception) {
                return res.status(exception.httpErrorCode).json({
                    message: exception.message
                });
            }
        });
    }
    createRoutes() {
        this.route.post('/authenticate', this.authenticate.bind(this));
        return this.route;
    }
}
exports.default = AuthController;
//# sourceMappingURL=AuthController.js.map