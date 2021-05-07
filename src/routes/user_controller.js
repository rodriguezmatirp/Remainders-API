const express = require("express");
const bodyParser = require("body-parser");

const {User} = require("../db/models/user");
const {authenticate} = require('../middlewares/auth');
const {verifySession} = require('../middlewares/verify_session');

const userRoute = new express.Router();

const urlencodedParser = bodyParser.urlencoded({extended: true});

userRoute.post('/register', urlencodedParser, async(req, res) => {
    // User sign up
    let body = req.body;
    let newUser = new User(body);

    await newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we generate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send({"user_id" : newUser._id, "username" : newUser.name, "Status" : "Created Successfully"});
    }).catch((e) => {
        res.status(400).send(e);
    })
})

userRoute.post('/login', urlencodedParser,(req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session created successfully - refreshToken returned.
            // now we generate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                // access auth token generated successfully, now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send({
                    "user_id" : user._id,
                    "access-token" : authTokens.accessToken,
                    "status" : "Logged In"
                });
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

userRoute.get('/me/access-token', verifySession, (req, res) => {
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ "Token" : accessToken, "Message" : "Added Header" })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

userRoute.get('/logout', authenticate, async (req,res)=>{
     try {
        req.user.sessions = []
        await req.user.save()
        res.send({"Status" : "Logged Out"})
    } catch (e) {
        res.status(500).send()
    }
})

module.exports.userRoute = userRoute;