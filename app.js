import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./router/index.js";
import clearOnline from "./helpers/clearOnline.js";
import verificationAuth from "./middleware/auth.js";

dotenv.config();
await clearOnline();

const app = express();

app.use(cors());
app.use(express.json());
app.use(verificationAuth);
app.use('/', router);

export default app;
