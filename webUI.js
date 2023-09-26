const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

router.get("/", (req, res) => {
  res.render("chart");
});

// Modify the route to return JSON data
router.get("/data", (req, res) => {
  const db = new sqlite3.Database("ping_results.db");
  db.all(
    "SELECT timestamp, response_time, packet_loss FROM ping_results",
    (err, rows) => {
      if (err) {
        console.error("Error retrieving data from the database:", err);
        res.status(500).json({error: "Internal Server Error"});
        return;
      }

      const timestamps = rows.map((row) => row.timestamp);
      const responseTimes = rows.map((row) => row.response_time);
      const packetLoss = rows.map((row) => row.packet_loss);

      res.json({timestamps, responseTimes, packetLoss});
    }
  );
  db.close();
});

module.exports = router;
