import express from "express";
import inicioConfigController from "../controllers/inicioConfigController.js";
import upload from "../utils/cloudinaryConfig.js";

const router = express.Router();

router
  .route("/")
  .get(inicioConfigController.getInicioConfig)
  .put(upload.single("imagen"), inicioConfigController.updateInicioConfig);

export default router;
