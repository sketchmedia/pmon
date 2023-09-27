const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

router.get("/", (req, res) => {
  res.render("chart");
});

// Modify the route to return JSON data within the specified date range
// router.get("/data", (req, res) => {
//   const startDate = req.query.startDate; // Convert start date to Unix timestamp
//   const endDate = req.query.endDate; // Convert end date to Unix timestamp

//   const db = new sqlite3.Database("ping_results.db");
//   const query =
//     "SELECT timestamp, response_time, packet_loss FROM ping_results WHERE timestamp >= ? AND timestamp <= ?";

//   db.all(query, [startDate, endDate], (err, rows) => {
//     if (err) {
//       console.error("Error retrieving data from the database:", err);
//       res.status(500).json({error: "Internal Server Error"});
//       return;
//     }

//     const timestamps = rows.map((row) => new Date(row.timestamp).toISOString()); // Convert Unix timestamp to ISO format
//     const responseTimes = rows.map((row) => row.response_time);
//     const packetLoss = rows.map((row) => row.packet_loss);

//     res.json({timestamps, responseTimes, packetLoss});
//   });
//   db.close();
// });
router.get("/data", (req, res) => {
  const startDate = req.query.startDate; // Convert start date to Unix timestamp
  const endDate = req.query.endDate; // Convert end date to Unix timestamp

  const db = new sqlite3.Database("ping_results.db");

  // Define the window size for calculating the moving average and standard deviation.
  const windowSize = 60; // Adjust this value as needed.

  // Use SQL queries to retrieve data within the date range.
  const query = `
    SELECT
      timestamp,
      response_time,
      packet_loss
    FROM ping_results
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `;

  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error("Error retrieving data from the database:", err);
      res.status(500).json({error: "Internal Server Error"});
      return;
    }

    // Calculate moving average and standard deviation for response times.
    const filteredRows = [];
    let responseTimeSum = 0;
    let responseTimeSquaredSum = 0;

    for (let i = 0; i < rows.length; i++) {
      const responseTime = rows[i].response_time;

      // Update sums for calculating average and standard deviation.
      responseTimeSum += responseTime;
      responseTimeSquaredSum += responseTime * responseTime;

      // Add the row to the filtered list.
      filteredRows.push(rows[i]);

      // Check if we have enough data points for the window.
      if (i >= windowSize - 1) {
        // Calculate the moving average and standard deviation.
        const average = responseTimeSum / windowSize;
        const variance =
          responseTimeSquaredSum / windowSize - average * average;
        const standardDeviation = Math.sqrt(variance);

        // Check if the current data point deviates significantly from the average.
        if (Math.abs(responseTime - average) >= 2 * standardDeviation) {
          // Highlight or store the data point as significant.
          // You can add a flag or property to the row to indicate significance.
          filteredRows[i].significant = true;
        }

        // Remove the oldest data point from the sums.
        const removedResponseTime = rows[i - windowSize + 1].response_time;
        responseTimeSum -= removedResponseTime;
        responseTimeSquaredSum -= removedResponseTime * removedResponseTime;
      }
    }

    const significantRows = filteredRows.filter((row) => row.significant);

    const timestamps = significantRows.map((row) =>
      new Date(row.timestamp).toISOString()
    );
    const responseTimes = significantRows.map((row) => row.response_time);
    const packetLoss = significantRows.map((row) => row.packet_loss);
    const isSignificant = significantRows.map(() => true);

    res.json({timestamps, responseTimes, packetLoss, isSignificant});
  });

  db.close();
});
module.exports = router;
