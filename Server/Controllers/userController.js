const { query } = require("express");

User = require("../Models/User");

exports.getAllUsers = (req, res) => {
    User.get(function (err, users){
        if (err) {
            return res.status(500).json({
                status: "internal server error",
                message: err,
            })
        }
        res.json({
            status: "success",
            message: "Users retrieved successfully",
            data: users
        })
    });
}

exports.create = (req, res) => {
    var user = new User();
    var b = new User();
    b = req.body;
    console.log(b);
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.hashedPassword = req.body.hashedPassword;
    user.birthday = req.body.birthday;
    user.phone = req.body.phone;
    user.phoneCountryCode = req.body.phoneCountryCode;
    user.address.country = req.body.country;
    user.address.city = req.body.city;
    user.address.street = req.body.street;
    user.role = req.body.role;
    user.imagePath = req.body.imagePath;
    user.save().then(savedUser => {
        res.json({
            status: "success",
            message: "user has been created",
            data: savedUser
        });
    }).catch(err => {
        console.log(err);
        if (err.name === 'MongoServerError' && err.code === 11000) {
            res.status(400).json({ status: "error", message: 'Email already exist' });
        } else{
            res.status(400).json({ status: "error", message: err});
        }
    })
}

exports.deleteOne = (req, res) => {
    if (!req.body._id && !req.body.email)
        return res.status(406).json({ status: "error", message: 'User to delete must contain unique value'});
    filter = {};
    req.body._id != undefined ? filter["_id"] = req.body._id : ""; 
    req.body.email != undefined ? filter["email"] = req.body.email : "";
    User.deleteOne(filter).then(deletedUser => {
            if(deletedUser.deletedCount == 0)
                return res.json({status: "failed", message: "User has not found"});
            res.json({status: "success", message: "User has been deleted"});
        }).catch(err => {
            console.log(err);
            res.status(500).json({status: "error", message: 'Server failed'});
        });
};

exports.updateOne = (req, res) => {
    if (!req.body._id && !req.body.email)
        return res.status(406).json({ status: "error", message: 'User to update must contain Id'});
    else if (req.body.updateAttr._id)
        return res.status(406).json({ status: "error", message: 'Canot update _Id'});
    filter = {};
    req.body._id != undefined ? filter["_id"] = req.body._id : ""; 
    req.body.email != undefined ? filter["email"] = req.body.email : "";

    User.findOneAndUpdate(filter, req.body.updateAttr , {runValidators : true}, function(error, doc){
        if(error){
            console.log(error)
            return res.status(500).json({status: "error", message: 'Server failed'});
        } else if (!doc){
            return res.json({status: "failed", message: "User has not found"});
        }
        res.json({status: "success", message: "User has been updated"});
    })
}