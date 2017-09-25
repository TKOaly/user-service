const route = require('express').Router();

/**
 * @param {AuthenticatioService} authenticationService
 */
module.exports = function authController(authenticationService) {
  route.post('/', (req, res) => {
    if (req.body.username && req.body.password) {
      authenticationService.fetchToken(req.body.username, req.body.password).then(token => {
        res.status(200);
        return res.json({
          message: 'Ok',
          body: token
        });
      }).catch(exception => {
        res.status(exception.httpErrorCode);
        return res.json({
          message: exception.message,
          body: null
        });
      });
    } else {
      res.status(400);
      return res.json({
        message: 'Missing parameters',
        body: null
      });
    }
  });
  return route;
};
