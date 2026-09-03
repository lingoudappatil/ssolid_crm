// =================== IMPORTS ===================
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Models
import Lead from "./models/Leads.js";


// Routes
import followUpRoutes from "./routes/followUps.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import orderRoutes from "./routes/orders.js";


// Config
import { connectDB } from "./config/db.js";

const app = express();

dotenv.config();

// =================== DATABASE ===================

connectDB()
  .then(() => {
    console.log("✅ MySQL connected");
  })
  .catch((err) => {
    console.error("❌ DB connect error", err);
  });

// =================== MIDDLEWARE ===================

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// =================== ROUTES ===================

app.use("/api", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/orders", orderRoutes);

// =================== FRONTEND DEPLOYMENT ===================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientBuildPath = path.join(__dirname, "../client/build");

console.log("📁 Looking for React build at:", clientBuildPath);

console.log(
  "📁 index.html exists?",
  fs.existsSync(path.join(clientBuildPath, "index.html"))
);

app.use(express.static(clientBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// =================== ERROR HANDLING ===================

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  res.status(500).json({
    error: "Internal Server Error"
  });
});

// =================== START SERVER ===================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);