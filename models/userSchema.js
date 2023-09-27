const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const keySecret = "hasrhpathakvijaybhaipathakharsh213"

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Not a valid Email");
      }
    },
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  cpassword: {
    type: String,
    required: true,
    minlength: 6,
  },

  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  verifytoken:{
    type: "String",
  }
});

//hash password
userSchema.pre("save", async function (next) {
  if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password, 15);
    this.cpassword = await bcrypt.hash(this.cpassword, 15);
  }

  next();
});

userSchema.methods.generateAuthtoken = async function () {
  try {
    let token23 = jwt.sign({_id:this._id}, keySecret,{
      expiresIn: "1d"  
    });

    this.tokens = this.tokens.concat({token:token23});
    await this.save();
    return token23;

  } catch (error) {
    res.status(422).json(error);
  }
};

//creating model

const userdb = new mongoose.model("users", userSchema);

module.exports = userdb;
