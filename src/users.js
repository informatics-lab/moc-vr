"use strict";

var users = {
    admins: [
        "tpowellmeto",
        "anthony-duke",
        "salter1836",
        "tam203"
    ]
};

exports.isAdmin = function (req, res, next) {
    if (users.admins.includes(req.user.username)) {
        res.locals.user = {admin: true};
    } else {
        res.locals.user = {admin: false};
    }
    return next();
};
