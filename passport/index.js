const passport = require("passport");
const local = require("./localStrategy");

module.exports = (passport, db) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.query("SELECT * FROM user WHERE id = ?", [id]);
      const user = rows[0];
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  local(passport, db);
};
