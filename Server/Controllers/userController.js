const { query } = require("express");
var bcrypt = require('bcrypt');

User = require("../Models/User");

exports.getAllUsers = (req, res) => {
    User.get(function (err, users){
        if (err) {
            return res.json({
                status: "error",
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
    for (const property in req.body){
        user[property] = req.body[property]
    }
    console.log(user)
    user.save().then(savedUser => {
        res.json({
            status: "success",
            message: "user has been created",
            data: savedUser
        });
    }).catch(err => {
        console.log(err);
        if (err.name === 'MongoServerError' && err.code === 11000) {
            res.status(422).json({ status: "error", message: 'Email already exist' });
        } else{
            res.json({ status: "error", message: err});
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

exports.connect = (req, res) => {
    if (!req.body.hashedPassword && !req.body.email)
        return res.status(406).json({ status: "error", message: 'must get an email and a password'});
    User.findOne({'email': req.body.email},'hashedPassword',function (err, user) {
        bcrypt.compare(req.body.hashedPassword, user.hashedPassword, function(err, r){
            if(err){
                res.status(500).json({status: "failed", message: 'internal server error'})
            }
            if (r) {
                res.json({status: "success"});
            } else {
                res.status(401).json({status: "failed", message: 'password is wrong!'})
            }
        })
      });
}