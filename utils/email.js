'use strict';
const nodemailer = require('nodemailer');
const config = require('../config/config');

const options = (employee, date, time, option) => {
  const templates = {
    confirmation: {
      subject: `Your booking at Cut Above Barbershop:`, // Subject line
      text: `Thank you for booking with us. You are confirmed for an appointment on ${date} at ${time} with ${employee}.`, // plain text body
      html: `<div>Thank you for booking with us. You are confirmed for an appointment on ${date} at ${time} with ${employee}.</div>`, // html body
    },
    modification: {
      subject: `Booking with Cut Above Barbershop has changed.`, // Subject line
      text: `Your original booking has been changed. You are now confirmed for an appointment on ${date} at ${time} with ${employee}.`, // plain text body
      html: `<div>Your original booking has been modified. You are now confirmed for an appointment on ${date} at ${time} with ${employee}.</div>`, // html body
    },
    cancellation: {
      subject: `Booking with Cut Above Barbershop has cancelled.`, // Subject line
      text: `Your booking  on ${date} at ${time} with ${employee} has been cancelled. We are sorry to hear you can't make it. For any future needs, we are always here for you.`, // plain text body
      html: `<div>our booking  on ${date} at ${time} with ${employee} has been cancelled. We are sorry to hear you can't make it. For any future needs, we are always here for you.</div>`, // html body
    },
  };

  if (option in templates) {
    return templates[option];
  } else {
    throw new Error(`Invalid template option type: '${option}'`);
  }
};

const sendEmail = async ({ receiver, employee, date, time, option }) => {
  const transporter = nodemailer.createTransport({
    service: config.EMAIL_SERVICE,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASSWORD,
    },
  });

  const senderReceiverOptions = {
    from: config.EMAIL_USER,
    to: `${receiver}`,
  };

  const emailTemplate = options(employee, date, time, option);
  const fullEmailOptions = { ...senderReceiverOptions, ...emailTemplate };

  // Send Email
  transporter.sendMail(fullEmailOptions, function (err, info) {
    if (err) {
      console.log({ err });
    } else {
      console.log({ info });
    }
  });
};

module.exports = sendEmail;
