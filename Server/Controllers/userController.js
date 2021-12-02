User = require("../Models/User");

exports.getAllUsers = (req, res) => {
    User.get(function (err, users){
        if (err) {
            res.json({
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
            return res.status(422).json({ status: "error", message: 'Email already exist' });
        } else{
            res.json({ status: "error", message: err});
        }
    })
}