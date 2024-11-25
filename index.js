const express = require("express");
const ejs = require("ejs");
const mysql = require("mysql2");
const morgan = require("morgan");
const app = express();
const port = 8000;
const passport = require("passport");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const passportConfig = require("./passport");
const dotenv = require("dotenv");
dotenv.config();

const sqlScript = fs.readFileSync(
  path.join(__dirname, "create_db.sql"),
  "utf8"
);

const initialConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // database: process.env.DATABASE
});

initialConnection.connect((err) => {
  if (err) throw err;

  const queries = sqlScript.split(";").filter((query) => query.trim());

  queries.forEach((query) => {
    if (query.trim()) {
      initialConnection.query(query, (err) => {
        if (err) console.error("Error executing query:", err);
      });
    }
  });

  initialConnection.end();

  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  db.connect((err) => {
    if (err) {
      throw err;
    }
    console.log("Connected to database");
  });
  global.db = db;
});

passportConfig();
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

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}!`)
);

