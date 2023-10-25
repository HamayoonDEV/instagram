import express from "express";
import { PORT } from "./config/index.js";
import connectDb from "./database/database.js";
import router from "./routes/index.js";
import errorHandler from "./middleWare/errorHandler.js";

const app = express();

connectDb();
app.use(express.json());
app.use(router);
app.use(errorHandler);
app.listen(PORT, console.log(`server is running on PORT:${PORT}`));
