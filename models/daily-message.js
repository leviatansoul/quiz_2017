
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('DailyMessage',
        {
            day: {
                type: DataTypes.INTEGER,

            },
            text: {
                type: DataTypes.STRING,
                validate: {notEmpty: {msg: "Falta Respuesta"}}
            }
        });
};