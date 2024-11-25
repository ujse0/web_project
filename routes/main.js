var express = require("express");
var router = express.Router();
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
const guard = (req, res, next) => {
  if (!req.user) {
    res.redirect("http://localhost:8000/login?error=session_expired");
  }
  next();
};

const shopData = { shopName: "Event App" };
// Handle our routes
router.get("/", function (req, res) {
  res.render("index.ejs", shopData);
});
router.get("/login", (req, res) => {
  res.render("login.ejs", shopData);
});
router.get("/register", (req, res) => {
  res.render("register.ejs", shopData);
});
router.get("/forgot-password", function (req, res) {
  res.render("forgot.ejs", shopData);
});
router.get("/my", guard, function (req, res) {
  const getMyProductsQuery = `
    SELECT p.*, u.user_name 
    FROM product p
    JOIN user u ON p.user_id = u.id
    WHERE u.user_name = ?
    ORDER BY p.created_at DESC
  `;

  db.query(getMyProductsQuery, [req.user.user_name], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error getting products");
    }
    res.render("my", {
      user: req.user,
      myProducts: results,
      shopName: shopData.shopName,
      formatFunc: (date) => {
        date = new Date(date);
        var year = date.getFullYear().toString().slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        return year + "." + month + "." + day;
      },
    });
  });
});
router.get("/my/update", guard, (req, res) => {
  res.render("my-update", shopData);
});
router.post("/my/update", guard, (req, res) => {
  const { username, introduce } = req.body;
  const updateQuery = "update user set introduce=? where user_name=?";
  db.query(updateQuery, [introduce, username], (err, result) => {
    if (err) console.log(err);
    res.redirect("http://localhost:8000/my");
  });
});

router.get("/post/add", guard, (req, res) => {
  res.render("add-product.ejs", shopData);
});

router.post("/forgot", (req, res) => {
  const { username, sentence } = req.body;
  const sentenceQuery =
    "select password_sentence,origin_pwd from user where user_name=?";
  db.query(sentenceQuery, [username], (err, result) => {
    console.log(err);
    console.log(result);
    if (err) {
      console.log(err);
    }
    if (result.length > 0) {
      result[0].password_sentence == sentence
        ? (isEqual = true)
        : (isEqual = false);
      if (isEqual) {
        res.redirect(
          `http://localhost:8000/forgot-password?pwd=${result[0].origin_pwd}`
        );
      } else {
        res.redirect("http://localhost:8000/forgot-password?error=wrong-date");
      }
    } else {
      res.redirect("http://localhost:8000/forgot-password?error=not-found-id");
    }
  });
});

router.post("/post/add", guard, (req, res) => {
  const { username, name, description, price, location } = req.body;

  const getUserIdQuery = "SELECT id FROM user WHERE user_name = ?";
  db.query(getUserIdQuery, [username], (err, userResult) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error getting user id");
    }

    const user_id = userResult[0].id;
    const createProductQuery =
      "INSERT INTO product (user_id, name, description, price, location) VALUES (?, ?, ?, ?, ?)";

    db.query(
      createProductQuery,
      [user_id, name, description, price, location],
      (err, results) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error creating product");
        }
        res.status(201).redirect("http://localhost:8000/post");
      }
    );
  });
});
router.post("/apply/delete/:id", guard, (req, res) => {
  const deleteParticipantQuery =
    "delete from participant where event_id =? and user_name=?";
  db.query(
    deleteParticipantQuery,
    [req.params.id, req.body.username],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect(`http://localhost:8000/post/${req.params.id}`);
      }
    }
  );
});
router.post("/participant/delete/:id", guard, (req, res) => {
  if (req.body.username == req.user.user_name) {
    res.redirect(
      `http://localhost:8000/post/update/${req.params.id}?error=Event-Holder-cannot-be-deleted`
    );
  } else {
    const userExistQuery =
      "select * from participant where event_id =? and user_name=?";
    db.query(
      userExistQuery,
      [req.params.id, req.body.username],
      (err, result1) => {
        if (result1.length < 1) {
          res.redirect(
            `http://localhost:8000/post/update/${req.params.id}?error=User-Not_Exist-In-Event`
          );
        } else {
          const deleteParticipantQuery =
            "delete from participant where event_id =? and user_name=?";
          db.query(
            deleteParticipantQuery,
            [req.params.id, req.body.username],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                res.redirect(
                  `http://localhost:8000/post/update/${req.params.id}`
                );
              }
            }
          );
        }
      }
    );
  }
});
router.post("/participant/:id", guard, (req, res) => {
  const createParticipantQuery =
    "insert into participant (user_name,event_id) values (?,?)";
  db.query(
    createParticipantQuery,
    [req.body.username, req.params.id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect(`http://localhost:8000/post/${req.params.id}`);
      }
    }
  );
});
router.get("/post", guard, function (req, res) {
  const getProductsQuery = `
    SELECT p.*, u.user_name 
    FROM product p
    JOIN user u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `;

  db.query(getProductsQuery, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error getting products");
    }
    res.render("product-list", {
      products: results,
      shopName: shopData.shopName,
      formatFunc: (date) => {
        date = new Date(date);
        var year = date.getFullYear().toString().slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        return year + "." + month + "." + day;
      },
    });
  });
});

router.get("/post/update/:id", guard, (req, res) => {
  const getPostQuery = `select * from event where event_id=? `;
  db.query(getPostQuery, [req.params.id], (err, results) => {
    if (err) {
      console.log(err);
      res.send(`can not get data : ${err.message}`);
    }
    const getParticipantQuery =
      "select user_name from participant where event_id=?";
    arr = [];
    db.query(getParticipantQuery, [req.params.id], (err, result) => {
      if (err) console.log(err);
      for (let i of result) {
        arr.push(i.user_name);
      }
      res.render("update", {
        event: results[0],
        partList: arr,
        shopName: shopData.shopName,
      });
    });
  });
});

router.post("/post/update/:id", guard, (req, res) => {
  const { name, description, price, location, status } = req.body;
  const updateQuery =
    "UPDATE product SET name = ?, description = ?, price = ?, location = ?, status = ? WHERE id = ?";

  db.query(
    updateQuery,
    [name, description, price, location, status, req.params.id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error updating product");
      }
      res.redirect(`http://localhost:8000/post/${req.params.id}`);
    }
  );
});

router.get("/post/:id", guard, (req, res) => {
  const getProductQuery = `
    SELECT p.*, u.user_name 
    FROM product p
    JOIN user u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  db.query(getProductQuery, [req.params.id], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error getting product");
    }
    res.render("product-detail", {
      product: results[0],
      shopData: shopData,
      user: req.user,
    });
  });
});

router.post("/post/delete/:id", guard, function (req, res) {
  const deleteQuery = "DELETE FROM product WHERE id = ?";
  db.query(deleteQuery, [req.params.id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error deleting product");
    }
    res.redirect("http://localhost:8000/post");
  });
});
module.exports = router;
