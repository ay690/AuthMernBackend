const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const keySecret = "hasrhpathakvijaybhaipathakharsh213";

//email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "aniketyadav690@gmail.com",
    pass: "onnjrsxbtrafkdur",
  },
});

//for user registration
router.post("/register", async (req, res) => {
  // console.log(req.body);
  const { fname, email, password, cpassword } = req.body;

  if (!fname || !email || !password || !cpassword) {
    res.status(422).json({ error: "Fill all the details" });
  }

  try {
    const preUser = await userdb.findOne({ email: email });

    if (preUser) {
      res.status(422).json({ error: "Email already exists" });
    } else if (password != cpassword) {
      res
        .status(422)
        .json({ error: "Pasword and confirm password does not match" });
    } else {
      const finalUser = new userdb({
        fname,
        email,
        password,
        cpassword,
      });

      //here password hashing

      const storeData = await finalUser.save();
      console.log(storeData);
      res.status(201).json({ status: 201, storeData });
    }
  } catch (error) {
    res.status(422).json(error);
    console.log("Catch block error");
  }
});

//userloginApi
router.post("/login", async (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ error: "Fill all the details" });
  }

  try {
    const userValid = await userdb.findOne({ email: email });
    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);

      if (!isMatch) {
        res.status(422).json({ error: "Invalid details" });
      } else {
        //generate a token
        const token = await userValid.generateAuthtoken();
        console.log(token);

        //generate cookie
        res.cookie("usercookie", token, {
          expires: new Date(Date.now() + 9000000),
          httpOnly: true,
        });

        const result = {
          userValid,
          token,
        };

        res.status(201).json({ status: 201, result });
      }
    }
  } catch (error) {
    res.status(401).json(error);
    console.log("Catch block");
  }
});

//userValid api
router.get("/validuser", authenticate, async (req, res) => {
  console.log("Done");

  try {
    const validUserOne = await userdb.findOne({ _id: req.userId });
    res.status(201).json({ status: 201, validUserOne });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

//logout api
router.get("/logout", authenticate, async (req, res) => {
  try {
    //remove the tokens
    req.rootUser.tokens = req.rootUser.tokens.filter((currElem) => {
      return currElem.token !== req.token;
    });

    //remove the cookie
    res.clearCookie("usercookie", { path: "/" });

    req.rootUser.save();

    res.status(201).json({ status: 201 });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

//sendPassword api
router.post("/sendpasswordlink", async (req, res) => {
  // console.log(req.body)

  const { email } = req.body;

  if (!email) {
    res.status(401).json({ status: 401, message: "Please enter your Email" });
  }

  try {
    const userFind = await userdb.findOne({ email: email });
    console.log("userFind", userFind);

    //generate token for reset password
    const token = jwt.sign({ _id: userFind._id }, keySecret, {
      expiresIn: "120s",
    });
    //console.log("token", token);
    const setUserToken = await userdb.findByIdAndUpdate({_id:userFind._id}, {verifytoken:token}, {new:true});
    console.log("setUserToken", setUserToken);

    if(setUserToken){
        const mailOptions = {
            from: "aniketyadav690@gmail.com",
            to: email,
            subject: "Sending Email for password reset",
            text: `This link is valid for 2 MINUTES http://localhost:3000/forgotpassword/${userFind.id}/${setUserToken.verifytoken}`

        }

        transporter.sendMail(mailOptions,(error,info)=>{
           if(error){
            console.log("error", error);
            res.status(401).json({status: 401, message: "Email not sent!!!"})
           }else{
            console.log("Email sent", info.response);
            res.status(201).json({status:201, message: "Email sent successfully"})
           }
       })
    }

  } catch (error) {
    res.status(401).json({status: 401, message: "Invalid user!!!!"})
  }
});


// verify user for forgot password time
router.get("/forgotpassword/:id/:token",async(req,res)=>{
    const { id,token } = req.params;

    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        // console.log(validuser);
        const verifyToken = jwt.verify(token,keySecret);

        console.log(verifyToken)

        if(validuser && verifyToken._id){
            res.status(201).json({status:201,validuser})
        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }

    } catch (error) {
        res.status(401).json({status:401,error})
    }
});


// change password

router.post("/:id/:token",async(req,res)=>{
    const { id, token } = req.params;

    const { password } = req.body;

    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        
        const verifyToken = jwt.verify(token,keySecret);

        if(validuser && verifyToken._id){
            const newpassword = await bcrypt.hash(password,15);

            const setnewuserpass = await userdb.findByIdAndUpdate({_id:id},{password:newpassword});

            setnewuserpass.save();
            res.status(201).json({status:201,setnewuserpass})

        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }
    } catch (error) {
        res.status(401).json({status:401,error})
    }
})


module.exports = router;
