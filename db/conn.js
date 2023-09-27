//connection.js
const mongoose = require("mongoose");


const DB = "mongodb+srv://aniket:aniket1234@cluster0.5td6xj5.mongodb.net/Authusers?retryWrites=true&w=majority";

mongoose.connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => console.log("Database Connected")).catch((err) => {
    console.log(err);
})