const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

module.exports = (passport, db) => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const [rows] = await db.execute(
            "SELECT * FROM user WHERE user_name = ?",
            [username]
          );

          if (rows.length === 0) {
            return done(null, false, {
              message: "No exist user.",
            });
          }

          const user = rows[0];

          console.log("Input password:", password);
          console.log("Stored user:", user);

          if (!password || !user.pwd) {
            console.error("Password or stored hash is missing");
            return done(null, false, {
              message: "Incorrect login information.",
            });
          }

          const result = await bcrypt.compare(password, user.pwd);

          if (result) {
            return done(null, user);
          }
          return done(null, false, {
            message: "Incorrect password.",
          });
        } catch (error) {
          console.error("Login error:", error);
          return done(error);
        }
      }
    )
  );
};
