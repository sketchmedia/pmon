const ping = require("ping");
const sqlite3 = require("sqlite3").verbose();

const hostToPing = "google.com"; // Replace with your target host

const start = () => {
  const schedule = require("node-schedule");

  schedule.scheduleJob("*/5 * * * * *", async () => {
    try {
      const res = await ping.promise.probe(hostToPing);
      if (res.alive) {
        const {time} = res;
        const packetLoss = res.packetLoss || 0;

        const db = new sqlite3.Database("ping_results.db");
        db.run(
          `INSERT INTO ping_results (host, timestamp, response_time, packet_loss) VALUES (?, ?, ?, ?)`,
          [hostToPing, new Date(), time, packetLoss],
          (err) => {
            if (err) {
              console.error("Error inserting data into the database:", err);
            }
          }
        );
        db.close();
      } else {
        console.error(`Host ${hostToPing} is down.`);
      }
    } catch (error) {
      console.error("Error pinging the host:", error);
    }
  });
};

module.exports = {start};
