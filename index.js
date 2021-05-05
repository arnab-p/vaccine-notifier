const cron = require("node-cron");
const mailgun = require("mailgun-js");
const axios = require("axios");
require("dotenv").config();

const task = cron.schedule("* * * * *", async () => {
  const district_id = 725; // district_id for Kolkata

  const date = new Date();
  console.log("Checking......", date);
  const url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${formatDate(
    date
  )}`;

  const response = await axios.get(url).catch((error) => {
    console.log(error);
  });

  const { centers } = response.data;
  const filtered_centers = centers.filter((center) => {
    const { sessions } = center;
    const filtered_sessions = sessions.filter((session) => {
      const { available_capacity, min_age_limit } = session;
      return min_age_limit === 18 && available_capacity > 0;
    });
    return filtered_sessions.length > 0;
  });

  console.log(JSON.stringify(filtered_centers));
  if (filtered_centers.length > 0) {
    // send mail through mailgunconst mailgun = require("mailgun-js");
    console.log("Sending Email...");
    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_KEY;
    const mg = mailgun({ apiKey, domain });
    const data = {
      from: `Mailgun Sandbox <${process.env.MAILGUN_FROM}>`,
      to: process.env.MAILGUN_TO,
      subject: "VACCINE NOTIFICATION",
      text: `${
        filtered_centers.length
      } centers available.\n\n List: \n${JSON.stringify(filtered_centers)}`,
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });
  }
});

task.start();
console.log("Task started");

const formatDate = (date) => {
  let d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) {
    month = "0" + month;
  }
  if (day.length < 2) {
    day = "0" + day;
  }

  return [day, month, year].join("-");
};


