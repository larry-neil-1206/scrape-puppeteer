import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cron from 'node-cron'
import dotenv from 'dotenv'

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import scrapperRouter from "./routes/scrapper.js";
import ScrapperController from './controllers/scrapper.controller.js'

dotenv.config()

var app = express();

// view engine setup
const __dirname = path.dirname(import.meta.url);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/scrapper", scrapperRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

cron.schedule('0 12 * * *', () => {
  console.log("Data Scrapping started...")
  ScrapperController.getProducts();
});

const PORT = process.env.PORT | 3000;
const RUN_ENV = process.env.NODE_ENV ?? "development";

app.listen(
  PORT,
  console.log(`Server running in ${RUN_ENV} mode on port ${PORT}`)
);
