const passport = require("passport");
const local = require("./localStrategy");

module.exports = () => {
  passport.serializeUser((user, done) => {
    console.log(user);
    done(null, user.user_name);
  });
  passport.deserializeUser(async (username, done) => {
    const userFindQuery = `select * from user where user_name='${username}'`;
    await db.query(userFindQuery, async (err, results) => {
      if (err) done(err);
      if (results.length !== 0) {
        done(null, results[0]);
      }
    });
  });

  local();
};
