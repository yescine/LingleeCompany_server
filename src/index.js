import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import httpError from "http-errors";
import routes from "./routes";
import errorHandler from "./middleware/ErrorHandler";
import config from "./config/app";

const app = express();

const morganFormat = config.isDev ? "dev" : "combined";
app.use(morgan(morganFormat));

mongoose
  .connect(config.mongoUri, { useNewUrlParser: true })
  .catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use("/api", ...routes);

app.use((req, res, next) => {
  next(httpError(404));
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log('\x1b[36m%s\x1b[0m',`Server started ${config.host}:${config.port}`);
});
