const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const userFindQuery = `select * from user where user_name='${username}'`;
          db.query(userFindQuery, async (err, results) => {
            if (err) {
              console.error(err);
              return next(err);
            }
            if (results.length === 0) {
              done(null, false, { message: "Not registered User." });
            } else {
              const result = await bcrypt.compare(password, results[0].pwd);
              if (result) {
                done(null, results[0]);
              } else {
                done(null, false, { message: "password not match." });
              }
            }
          });
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
