const jwt = require("jsonwebtoken");
const userdb = require("../models/userSchema");
const keySecret = "hasrhpathakvijaybhaipathakharsh213";

const authenticate = async (req, res, next) => {
  try {

    //token generate getting from frontend
    const token = req.headers.authorization;
    console.log(token);

    //verify the token
    const verifyToken = jwt.verify(token, keySecret);
    console.log(verifyToken);

    //token verification mein _id mili and usse database mein find karenge
    const rootUser = await userdb.findOne({ _id: verifyToken._id });
    console.log(rootUser);
     
    if(!rootUser){
        throw new Error("User not found");
    }

    req.token = token;
    req.rootUser = rootUser;
    req.userId = rootUser._id;

    next();

  } catch (error) {
    res.status(401).json({status: 401, message: "Unauthorized!!!, no token provided"})
  }
};

module.exports = authenticate;
