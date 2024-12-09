const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");

const router = express.Router();

router.post("/register", isNotLoggedIn, async (req, res, next) => {
  const { username, password, password_sentence, introduce } = req.body;

  try {
    const [existingUsers] = await db.query(
      "SELECT * FROM user WHERE user_name = ?",
      [username]
    );

    if (existingUsers.length === 0) {
      const hash = await bcrypt.hash(password, 12);
      await db.query(
        "INSERT INTO user (user_name, pwd, origin_pwd, password_sentence, introduce) VALUES (?, ?, ?, ?, ?)",
        [username, hash, password, password_sentence, introduce]
      );
      res.redirect("https://www.doc.gold.ac.uk/usr/113/login");
    } else {
      return res.redirect("https://www.doc.gold.ac.uk/usr/113/register?error=exist");
    }
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`https://www.doc.gold.ac.uk/usr/113/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect("https://www.doc.gold.ac.uk/usr/113/");
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
    res.redirect("https://www.doc.gold.ac.uk/usr/113/");
  });
});

module.exports = router;
