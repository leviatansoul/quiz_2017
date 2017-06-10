var models = require("../models");
var Sequelize = require('sequelize');



exports.get = function (req, res, next) {


    models.DailyMessage.findAll()

    .then(function (dailies) {
        var mensajes = dailies.map(function (daymessage) {
            return daymessage.text;
        });
        res.render('index', {
            dailytexts: mensajes
        });
    })

    .catch(function (error) {
        next(error);
    });

};









