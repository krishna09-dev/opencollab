import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();