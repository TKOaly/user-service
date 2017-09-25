const route = require('express').Router();

/**
 * @param {UserService} userService
 */
module.exports = function authController(userService) {
  route.get('/me', (req, res) => {
    if (req.headers['authorization']) {
      userService.fetchUser(req.headers['authorization']).then(user => {
        res.status(200);
        return res.json({
          message: 'Ok',
          body: user
        });
      }).catch(exception => {
        res.status(exception.httpErrorCode);
        return res.json({
          message: exception.message,
          body: null
        });
      });
    } else {
      res.status(401);
      return res.json({
        message: 'Unauthorized',
        body: null
      });
    }
  });
  return route;
};
