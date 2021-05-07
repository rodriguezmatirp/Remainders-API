const jwt = require('jsonwebtoken')
const {User} = require('../db/models/user')

const authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // verify the JWT
    jwt.verify(token, User.getJWTSecret(), async (err, decoded) => {
        if (err) {
            // there was an error
            // jwt is invalid - * DO NOT AUTHENTICATE *
            res.status(401).send(err);
        } else {
            // jwt is valid
            const user = await User.findById(decoded._id)
            if (!user) res.status(400).send('Invalid token, User authentication failed !')
            req.user = user
            req.user_id = decoded._id;
            next();
        }
    });
}

module.exports.authenticate = authenticate