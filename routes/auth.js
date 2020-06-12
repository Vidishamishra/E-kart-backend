const express = require("express");
const router = express.Router();

const {
    signup,
    signin,
    signout,
    verifyUser,
    resendToken,
    requireSignin
} = require("../controllers/auth");
const { userSignupValidator } = require("../validator");

router.post("/signup", userSignupValidator, signup);
router.get('/verifyUser', verifyUser);
router.get('/resendToken', resendToken);
router.post("/signin", signin);
router.get("/signout", signout);

module.exports = router;