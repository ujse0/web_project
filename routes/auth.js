const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");

const router = express.Router();

router.post("/register", isNotLoggedIn, async (req, res, next) => {
  const { username, password, password_sentence, introduce } = req.body;

  const userFindQuery = `select * from user where user_name='${username}'`;
  db.query(userFindQuery, async (err, results) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (results.length === 0) {
      const hash = await bcrypt.hash(password, 12);
      const userCreateQuery = `INSERT INTO user (user_name,pwd,origin_pwd,password_sentence,introduce) VALUES
        (?,?,?,?,?)`;
      db.query(
        userCreateQuery,
        [username, hash, password, password_sentence, introduce],
        async (err, results) => {
          if (err) {
            console.log(err);
            res.send(err);
          } else {
            res.redirect("http://localhost:8000/login");
          }
        }
      );
    } else {
      return res.redirect("http://localhost:8000/register?error=exist");
    }
  });

  //   return res.redirect("/login");
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`http://localhost:8000/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect("http://localhost:8000/");
    });
  })(req, res, next);
});

router.get("/logout", isLoggedIn, (req, res, next) => {
  req.logout(req.user, (err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      req.session;
    });
    res.redirect("http://localhost:8000/");
  });
});

module.exports = router;
