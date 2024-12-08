const express = require("express");
const ejs = require("ejs");
const mysql = require("mysql2/promise");
const morgan = require("morgan");
const app = express();
const port = 8000;
const passport = require("passport");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const passportConfig = require("./passport");
const dotenv = require("dotenv");
const multer = require("multer");
dotenv.config();

const sqlScript = fs.readFileSync(
  path.join(__dirname, "create_db.sql"),
  "utf8"
);

async function initializeDatabase() {
  try {
    const initialConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    const queries = sqlScript.split(";").filter((query) => query.trim());

    for (const query of queries) {
      if (query.trim()) {
        try {
          await initialConnection.query(query);
        } catch (err) {
          console.error("Error executing query:", err);
        }
      }
    }

    await initialConnection.end();

    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    console.log("Connected to database");
    global.db = db;

    setupApp(db);
  } catch (err) {
    console.error("Database initialization error:", err);
    process.exit(1);
  }
}

function setupApp(db) {
  passportConfig(passport, db);
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(express.static(__dirname + "/public"));

  app.set("views", __dirname + "/views");

  app.set("view engine", "ejs");

  app.engine("html", ejs.renderFile);
  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: process.env.COOKIE_SECRET,
      cookie: {
        httpOnly: true,
        secure: false,
      },
    })
  );

  const indexRouter = require("./routes/main");
  const authRouter = require("./routes/auth");
  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/", indexRouter);
  app.use("/auth", authRouter);

  app.locals.shopData = { shopName: "MARKETPLACE" };

  app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500);
    res.render("error");
  });

  app.use("/uploads", express.static("public/uploads"));
}

initializeDatabase();

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}!`)
);
