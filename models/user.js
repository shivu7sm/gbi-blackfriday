var mongoose = require("mongoose");


var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    emailid: String
});


module.exports = mongoose.model("User", UserSchema);
