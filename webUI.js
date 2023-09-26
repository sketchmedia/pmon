const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

router.get("/", (req, res) => {
  res.render("chart");
});

// Modify the route to return JSON data within the specified date range
router.get("/data", (req, res) => {
  const startDate = req.query.startDate; // Convert start date to Unix timestamp
  const endDate = req.query.endDate; // Convert end date to Unix timestamp

  const db = new sqlite3.Database("ping_results.db");
  const query =
    "SELECT timestamp, response_time, packet_loss FROM ping_results WHERE timestamp >= ? AND timestamp <= ?";

  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error("Error retrieving data from the database:", err);
      res.status(500).json({error: "Internal Server Error"});
      return;
    }

    const timestamps = rows.map((row) => new Date(row.timestamp).toISOString()); // Convert Unix timestamp to ISO format
    const responseTimes = rows.map((row) => row.response_time);
    const packetLoss = rows.map((row) => row.packet_loss);

    res.json({timestamps, responseTimes, packetLoss});
  });
  db.close();
});

module.exports = router;
