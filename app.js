// app.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("ping_results.db");
const app = express();
const port = 3000;

const pingMonitor = require("./pingMonitor");
const webUI = require("./webUI");

app.set("view engine", "ejs");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ping_results (
      id INTEGER PRIMARY KEY,
      host TEXT,
      timestamp TIMESTAMP,
      response_time INTEGER,
      packet_loss REAL
    )
  `);
});

db.close((err) => {
  if (err) {
    console.error("Error closing the database connection:", err);
  } else {
    console.log("Database is ready.");
  }
});
// Initialize ping monitoring
pingMonitor.start();

// Serve the web UI
app.use(express.static("public"));
app.use("/ping-results", webUI);

app.listen(port, () => {
  console.log(`Ping monitor app listening at http://localhost:${port}`);
});
