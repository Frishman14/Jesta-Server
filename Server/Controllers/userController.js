const Mongoose = require("mongoose");
const user = require("../Models/User");

const User = Mongoose.model("user", user.userSchema);

exports.getAllUsers = (req, res) => {
    console.log(req)
    User.find({}, (err, answer) => {
        if(err){
            res.json({
                status: "error",
                message: err
            });
        }
        res.json({
            status: "all users",
            data: answer
        });
    });
}
