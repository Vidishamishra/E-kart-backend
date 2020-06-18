const User = require('../models/user');
const Token = require('../models/token');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 
const expressJwt = require('express-jwt');
const { errorHandler } = require('../helpers/dbErrorHandler');


//module for sign-up api
exports.signup = (req, res) => {

    User.findOne({ email: req.body.email }, function (err, user) {

        if (user) return res.status(400).json({ msg: 'The email address you have entered is already associated with another account.' });

        user = new User({ name: req.body.name, email: req.body.email, password: req.body.password });
        user.save(function (err) {
            if (err) { return res.status(400).send({ msg: err.message }); }

            // Create a verification token for this user
            var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

            // Save the verification token
            token.save(function (err) {
                if (err) { return res.status(400).json({ msg: err.message }); }

                // Send the email
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ekartonlineshop@gmail.com',
                        pass: 'ekART@123'
                    }
                });
                var mailOptions = {
                    from: 'ekartonlineshop@gmail.com',
                    to: user.email,
                    subject: 'Account Verification Token',
                    text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + 'localhost:3000' + '\/verifyUser?id=' + user._id + '&&token=' + token.token + '.\n'
                };
                transporter.sendMail(mailOptions, (err) => {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                    res.status(200).json({
                        user,
                        message: 'A verification email has been sent to ' + user.email + '.'
                    });
                });
                // res.status(200).send(token);
            });
        });
    })
}

//module for email verification of signed up user
exports.verifyUser = (req, res) => {
    let userId = req.query.id;
    let verificationToken = req.query.token;

    //if token present find a matching user
    User.findOne({ _id: userId }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User for this token not found'
            });
        }
        if (user.verified) {
            return res.status(400).json({
                message: 'Account already verified'
            })
        }
        else {
            Token.findOne({ _userId: userId }, (err, token) => {
                if (!!token && verificationToken === token.token) {

                    user.verified = true;
                    user.save((err) => {
                        if (err) {
                            return res.status(500).json({
                                msg: err.message
                            })
                        }
                        res.status(200).json({ message: "Account verified. Please log in." })
                    })
                } else {
                    return res.status(400).json((!!err) ? { errorcode: "440", error: err.message } : { errorcode: "440", error: 'Invalid/expired Token.' })
                }
            })
        }
    })
}

//module for logging in the user with verified account
exports.signin = (req, res) => {
    // find the user based on email
    const { email, password } = req.body;
    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            });
        }
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Email and password dont match'
            });
        }

        if (!user.verified) {
            return res.status(401).json({
                error: 'User not verified !!'
            })
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        res.cookie('t', token, { expire: new Date() + 9999 });

        const { _id, name, email, role } = user;
        return res.json({ token, user: { _id, email, name, role } });
    });
};

//resend token if expired
exports.resendToken = (req, res) => {
    User.findOne({ _id: req.query.id }, (err, user) => {

        if (user.Verified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });
        
        // Update the token: for the same user
        Token.findOneAndUpdate({ _userId: req.query.id }, { token: crypto.randomBytes(16).toString('hex') }, { new: true },
            (err, token) => {
                // if (!!token) { console.log(token) }
                if (err) { return res.status(500).send({ msg: err.message }); }

                // Send the email
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ekartonlineshop@gmail.com',
                        pass: 'ekART@123'
                    }
                });
                var mailOptions = {
                    from: 'ekartonlineshop@gmail.com',
                    to: user.email,
                    subject: 'Account Verification Token',
                    text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + 'localhost:3000' + '\/verifyUser?id=' + user._id + '&&token=' + token.token + '.\n'
                };
                transporter.sendMail(mailOptions, (err) => {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                    res.status(200).json({
                        user,
                        message: 'A verification email has been sent to ' + user.email + '.'
                    });
                });
                // res.status(200).send(token);

            });

    });
};

exports.signout = (req, res) => {
    res.clearCookie('t');
    res.json({ message: 'Signout success' });
};

//module for validating JWT and attach it to req payload
exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'auth'
});

//middleware:- match the user id in profile with req payload to check authenticity of user
exports.isAuth = (req, res, next) => {
    let user = req.profile && req.auth && req.profile._id == req.auth._id;
    if (!user) {
        return res.status(403).json({
            error: "Access denied"
        });
    }
    next();
};

//middleware:- to check user type/role for admin resource
exports.isAdmin = (req, res, next) => {
    if(req.profile.role === 0) {
        return res.status(403).json({
            error: "Admin resource! Access denied"
        });
    }
    next();
};