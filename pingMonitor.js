const ping = require("ping");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("ping_results.db");
const hostToPing = "google.co.uk";

const start = () => {
  const schedule = require("node-schedule");

  const thresholdFactor = 1.5; // Adjust this factor as needed to control sensitivity.

  schedule.scheduleJob("*/5 * * * * *", async () => {
    try {
      const res = await ping.promise.probe(hostToPing);
      if (res.alive) {
        const {time} = res;
        const packetLoss = res.packetLoss || 0;

        // Calculate the average ping time from historical data in the database.
        db.all("SELECT response_time FROM ping_results", [], (err, rows) => {
          if (err) {
            console.error(
              "Error reading historical data from the database:",
              err
            );
            return;
          }

          const historicalPingTimes = rows.map((row) => row.response_time);
          const averagePingTime =
            historicalPingTimes.reduce((acc, val) => acc + val, 0) /
            historicalPingTimes.length;

          // Define a threshold as a factor of the average ping time.
          const threshold = averagePingTime * thresholdFactor;

          if (Math.abs(time - averagePingTime) >= threshold) {
            // Insert the new ping result into the database.
            db.run(
              `INSERT INTO ping_results (host, timestamp, response_time, packet_loss) VALUES (?, ?, ?, ?)`,
              [hostToPing, new Date(), time, packetLoss],
              (err) => {
                if (err) {
                  console.error("Error inserting data into the database:", err);
                }
              }
            );
          }
        });
      } else {
        console.error(`Host ${hostToPing} is down.`);
      }
    } catch (error) {
      console.error("Error pinging the host:", error);
    }
  });

  //   schedule.scheduleJob("*/5 * * * * *", async () => {
  //     try {
  //       const res = await ping.promise.probe(hostToPing);
  //       if (res.alive) {
  //         const {time} = res;
  //         const packetLoss = res.packetLoss || 0;

  //         const db = new sqlite3.Database("ping_results.db");
  //         db.run(
  //           `INSERT INTO ping_results (host, timestamp, response_time, packet_loss) VALUES (?, ?, ?, ?)`,
  //           [hostToPing, new Date(), time, packetLoss],
  //           (err) => {
  //             if (err) {
  //               console.error("Error inserting data into the database:", err);
  //             }
  //           }
  //         );
  //         db.close();
  //       } else {
  //         console.error(`Host ${hostToPing} is down.`);
  //       }
  //     } catch (error) {
  //       console.error("Error pinging the host:", error);
  //     }
  //   });
};

module.exports = {start};
