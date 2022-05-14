const {gql, AuthenticationError} = require("apollo-server-express");
const {isAuthenticated} = require("../middlewares/authorize");
const {ROLES} = require("../Models/Common/consts");
const {getNumOfCreatedUsers} = require("../Controllers/dashboardController");

exports.dashboardTypeDefs = gql`
                    type GraphData {
                        labels: [String]
                        dataSets: [Int]
                    }
                    type Query {
                        getUsersRegistrationLastMonth: GraphData
                    }
                    `;

exports.dashboardResolvers = {
    Query: {
        getUsersRegistrationLastMonth: async (parent, args, context) => isAuthenticated(context, ROLES.ADMIN) ? await getNumOfCreatedUsers() : new AuthenticationError("unauthorized"),
    },
}