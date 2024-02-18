/**
 * This is the entry point for the application in production mode.
 * It is responsible for starting the server and serving the application.
 */

import express from "express";
import { createApp } from "./gizual-api";

const app: express.Express = express();
app.set("trust proxy", true);
const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 5172;

app.use(createApp());

app.listen(port, () => {
  console.log(`Server is running at a http://localhost:${port}`);
});
