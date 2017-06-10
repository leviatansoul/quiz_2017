'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.bulkInsert('DailyMessage', [
          {
              day: 1,
              text: "Case of the Mondays?",
              createdAt: new Date(),
              updatedAt: new Date()
          },
          {
              day: 2,
              text: "I know it's only Tuesday, but you can do it! ",
              createdAt: new Date(),
              updatedAt: new Date()
          },
          {
              day: 3,
              text: "Hump day baby!",
              createdAt: new Date(),
              updatedAt: new Date()
          },
          {
              day: 4,
              text: "We all know Thursday is the new Friday.",
              createdAt: new Date(),
              updatedAt: new Date()
          },
          {
              day: 5,
              text: "Thank God! We made it. Happy Friday folks!",
              createdAt: new Date(),
              updatedAt: new Date()
          },
          {
              day: 6,
              text: "It's Saturday fool! Stop using the Internets and go outside!",
              createdAt: new Date(),
              updatedAt: new Date()
          },
          {
              day: 7,
              text: "NFL Sunday! Or maybe some Netflix? Chill.",
              createdAt: new Date(),
              updatedAt: new Date()
          }
      ]);
  },

  down: function (queryInterface, Sequelize) {

      return queryInterface.bulkDelete('DailyMesage', null, {});

  }
};
