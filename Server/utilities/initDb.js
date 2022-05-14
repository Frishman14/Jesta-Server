const User = require("../Models/User");
const {createOne} = require("../Controllers/userController");
const Category = require("../Models/favors/Category");
const logger = require("../logger");

exports.initAdminUser = () => {
    User.find({email: "admin@jesta.com"}, function(error, user){
        if(user.length === 0){
            createOne({
                userParams: {
                    firstName: "admin",
                    lastName: "admin",
                    birthday: "1995-08-29T03:00:00",
                    email: "admin@jesta.com",
                    hashedPassword: "aA123456",
                    fullAddress: "givatyim ben-tzvi 23",
                    longitude: 32.12345,
                    altitude: 32.12345
                }
            }, true)
        }
    });
}

const categories =
    [
        {
            name: "ניקיון",
            subCategories: ["בית", "גינה", "רכב"]
        },
        {
            name: "הסעה",
            subCategories: []
        },
        {
            name: "השאלה",
            subCategories: []
        },
        {
            name: "בייביסיטר",
            subCategories: ["ילדים", "כלבים", "חתולים"]
        },
        {
            name: "תיקון",
            subCategories: ["מכשירי חשמל", "בגדים", "עבודות בית"]
        },
        {
            name: "עבודות",
            subCategories: ["ניקיון", "גינון", "אחר"]
        },
        {
            name: "שיעורים פרטיים",
            subCategories: ["אגלית" , "מתמטיקה", "אחר"]
        },
        {
            name: "עמותות",
            subCategories: []
        },
        {
            name: "אחר",
            subCategories: []
        }
    ]

exports.initCategories = () => {
    for (let category of categories) {
        Category.findOne({name: category.name}, function (err, exist) {
                if (err) {
                    logger.error("error in creating categories: " + err)
                }
                if (!exist) {
                    Category.create({name: category.name}, function (err, doc){
                        if (err) {
                            logger.error("error in creating categories: " + err)
                        }
                        createSubCategories(category, doc)
                    });
                }
                else {
                    createSubCategories(category, exist);
                }
            }
        )
    }
    logger.debug("finish creating categories")
}

const createSubCategories = (category,doc) => {
    for (let subCategory of category.subCategories) {
        Category.findOne({ parentCategory: doc._id, name: subCategory}, async function (err, exist) {
                if (err) {
                    logger.error("error in creating categories: " + err)
                }
                if (exist === null) {
                    await Category.create({name: subCategory, parentCategory: doc._id});
                }
            }
        )
    }
}
