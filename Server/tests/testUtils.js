exports.validUser = {
            firstName: "mock",
            lastName: "mocky",
            birthday: "Fri Feb 25 1995 16:22:50 GMT+0200 (Israel Standard Time)",
            email: "test@example.com",
            hashedPassword: "aA123456",
            address: {
                country: "Israel",
                city: "Givatayim",
                street: "Ben-Zvi",
                location: {
                    coordinates: [32.12345,32.12345]
                }
            }
        }

exports.validCategory = {
    name: "categoryMock"
}

exports.validAddress = {
    fullAddress: "ben-tzvi 23 givatayim",
    location: {
        type: "Point",
        coordinates: [32.123456,32.123456]
    }
}