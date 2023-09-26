const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

const pingMonitor = require("./pingMonitor");
const webUI = require("./webUI");

app.set("view engine", "ejs");

function setupDatabase() {
  const db = new sqlite3.Database("ping_results.db");
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
}

setupDatabase();

pingMonitor.start();

app.use(express.static("public"));
app.use("/ping-results", webUI);

app.listen(port, () => {
  console.log(`Ping monitor app listening at http://localhost:${port}`);
});
