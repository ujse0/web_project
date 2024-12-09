var express = require("express");
var router = express.Router();
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
const guard = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login?error=session_expired");
  }
  next();
};

const shopData = { shopName: "MARKETPLACE" };
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
router.get("/my", guard, async function (req, res) {
  const getMyProductsQuery = `
    SELECT p.*, u.user_name 
    FROM product p
    JOIN user u ON p.user_id = u.id
    WHERE u.id = ?
    ORDER BY p.created_at DESC
  `;

  try {
    const [results] = await db.query(getMyProductsQuery, [req.user.id]);
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
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      message: "Error getting products",
      error: err,
    });
  }
});
router.get("/my/update", guard, (req, res) => {
  res.render("my-update", shopData);
});
router.post("/my/update", guard, async (req, res) => {
  const { username, introduce } = req.body;
  const updateQuery = "update user set introduce=? where user_name=?";
  try {
    await db.query(updateQuery, [introduce, username]);
    res.redirect("/my");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating user");
  }
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
        res.redirect(`/forgot-password?pwd=${result[0].origin_pwd}`);
      } else {
        res.redirect("/forgot-password?error=wrong-date");
      }
    } else {
      res.redirect("/forgot-password?error=not-found-id");
    }
  });
});

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

router.post("/post/add", guard, upload.single("image"), async (req, res) => {
  const { username, name, description, price, location } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [userResult] = await db.query(
      "SELECT id FROM user WHERE user_name = ?",
      [username]
    );
    const user_id = userResult[0].id;

    await db.query(
      "INSERT INTO product (user_id, name, description, price, location, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, name, description, price, location, image_url]
    );

    res.redirect("/post");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating product");
  }
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
        res.redirect(`/post/${req.params.id}`);
      }
    }
  );
});
router.post("/participant/delete/:id", guard, (req, res) => {
  if (req.body.username == req.user.user_name) {
    res.redirect(
      `/post/update/${req.params.id}?error=Event-Holder-cannot-be-deleted`
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
            `/post/update/${req.params.id}?error=User-Not_Exist-In-Event`
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
                res.redirect(`/post/update/${req.params.id}`);
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
        res.redirect(`/post/${req.params.id}`);
      }
    }
  );
});
router.get("/post", guard, async function (req, res) {
  const searchQuery = req.query.search
    ? req.query.search.trim().replace(/[<>]/g, "")
    : "";
  const sortOrder = ["asc", "desc"].includes(req.query.sort)
    ? req.query.sort
    : "desc";

  const getProductsQuery = `
    SELECT p.*, u.user_name 
    FROM product p
    JOIN user u ON p.user_id = u.id
    WHERE p.name LIKE ?
    ORDER BY p.created_at ${sortOrder === "asc" ? "ASC" : "DESC"}
  `;

  try {
    const [results] = await db.query(getProductsQuery, [`%${searchQuery}%`]);
    res.render("product-list", {
      products: results,
      shopName: shopData.shopName,
      searchQuery: searchQuery,
      currentSort: sortOrder,
      user: req.user,
      formatFunc: (date) => {
        date = new Date(date);
        var year = date.getFullYear().toString().slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        return year + "." + month + "." + day;
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      message: "Error getting products",
      error: err,
    });
  }
});

router.get("/post/update/:id", guard, async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT p.*, u.user_name, u.id as seller_id
       FROM product p
       JOIN user u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (results.length === 0) {
      return res.status(404).render("error", {
        message: "Product not found",
        shopName: shopData.shopName,
        user: req.user,
      });
    }


    if (req.user.id !== results[0].seller_id) {
      return res.status(403).render("error", {
        message: "You don't have permission to edit this product",
        shopName: shopData.shopName,
        user: req.user,
      });
    }

    res.render("update", {
      product: results[0],
      shopData: shopData,
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      message: "Error getting product",
      error: err,
      shopName: shopData.shopName,
      user: req.user,
    });
  }
});

router.post(
  "/post/update/:id",
  guard,
  upload.single("image"),
  async (req, res) => {
    const { name, description, price, location, status } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      if (image_url) {
        await db.query(
          "UPDATE product SET name = ?, description = ?, price = ?, location = ?, status = ?, image_url = ? WHERE id = ?",
          [name, description, price, location, status, image_url, req.params.id]
        );
      } else {
        await db.query(
          "UPDATE product SET name = ?, description = ?, price = ?, location = ?, status = ? WHERE id = ?",
          [name, description, price, location, status, req.params.id]
        );
      }

      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating product");
    }
  }
);

router.get("/post/:id", guard, async (req, res) => {
  const getProductQuery = `
    SELECT p.*, u.user_name, u.id as seller_id
    FROM product p
    JOIN user u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  try {
    const [results] = await db.query(getProductQuery, [req.params.id]);

    if (results.length === 0) {
      return res.status(404).render("error", {
        message: "Product not found",
        shopName: shopData.shopName,
        user: req.user,
      });
    }

    const product = results[0];

    res.render("product-detail", {
      product,
      shopName: shopData.shopName,
      user: req.user,
      formatFunc: (date) => {
        date = new Date(date);
        var year = date.getFullYear().toString().slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        return year + "." + month + "." + day;
      },
      isSeller: req.user.id === product.seller_id,
    });
  } catch (err) {
    console.error("Error getting product details:", err);
    res.status(500).render("error", {
      message: "Error getting product details",
      error: err,
      shopName: shopData.shopName,
      user: req.user,
    });
  }
});

router.post("/post/delete/:id", guard, async (req, res) => {
  try {

    const [product] = await db.query(
      "SELECT user_id FROM product WHERE id = ?",
      [req.params.id]
    );

    if (product.length === 0) {
      return res.status(404).send("Product not found");
    }

    if (product[0].user_id !== req.user.id) {
      return res
        .status(403)
        .send("You don't have permission to delete this product");
    }

    const [imageResult] = await db.query(
      "SELECT image_url FROM product WHERE id = ?",
      [req.params.id]
    );

    if (imageResult[0].image_url) {
      const imagePath = path.join(
        __dirname,
        "../public",
        imageResult[0].image_url
      );
      fs.unlink(imagePath, (err) => {
        if (err && err.code !== "ENOENT")
          console.error("Error deleting image:", err);
      });
    }


    await db.query("DELETE FROM product WHERE id = ?", [req.params.id]);
    res.redirect("/post");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
});


router.get("/chat/history/:productId", guard, async (req, res) => {
  try {
    const [results] = await db.query(
      `
      SELECT c.*, u.user_name as sender_name
      FROM chat c
      JOIN user u ON c.sender_id = u.id
      WHERE c.product_id = ?
      ORDER BY c.timestamp ASC
    `,
      [req.params.productId]
    );

    res.json(results);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error fetching chat history" });
  }
});


router.post("/chat/send", guard, async (req, res) => {
  const { productId, message } = req.body;

  try {

    const [productResult] = await db.query(
      `SELECT user_id as seller_id FROM product WHERE id = ?`,
      [productId]
    );

    if (!productResult.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const sellerId = productResult[0].seller_id;
    const senderId = req.user.id;
    const receiverId = sellerId;


    await db.query(
      `INSERT INTO chat (sender_id, receiver_id, product_id, message)
       VALUES (?, ?, ?, ?)`,
      [senderId, receiverId, productId, message]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Error processing chat" });
  }
});

const { body, validationResult } = require("express-validator");


const productValidationRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("The product name must be between 2 and 100 characters")
    .escape(),
  body("price").isFloat({ min: 0 }).withMessage("The price must be greater than 0"),
  body("location")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("The location must be between 2 and 100 characters.")
    .escape(),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("The description must be between 10 and 1000 characters")
    .escape(),
  body("status")
    .optional()
    .isIn(["saled", "reserved", "completed"])
    .withMessage("Invalid status"),
];


const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("error", {
      message: "Incorrect input value",
      error: errors.array(),
      shopName: shopData.shopName,
      user: req.user,
    });
  }
  next();
};

module.exports = router;
