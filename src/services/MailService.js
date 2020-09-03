import { MailComposer as KamilMailcomposer } from "kamil-mailcomposer";
import mailgunModule from "mailgun-js";
import fs from "fs";
import path from "path";
import ejs from "ejs-promise";
import AppError from "../exeptions/AppError";
import config from "../config";
import logger from "../utils/logger";
import {draftMail} from '../templates/mail/draftmail'
const nodemailer = require('nodemailer');

const root = path.join.bind(this, __dirname, "../../");
const srcPath = path.join.bind(this, __dirname, "../");

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  ignoreTLS: false,
  secure: true, // upgrade later with STARTTLS
  auth: {
    user: config.mail.from,
    pass:config.mail.password
  }
});

const saveEmailInFile = async data => {
try {
    console.log('--------- EMIAL IN FILE-----------')
    const mailComposer = new KamilMailcomposer();
    mailComposer.addHeader("x-mailer", "Nodemailer 1.0");
    mailComposer.setMessageOption(data);
    mailComposer.streamMessage();

    const pathFolder = root("./logs/mail");
    if (!fs.existsSync(pathFolder)) {
      fs.mkdirSync(pathFolder);
    }

    mailComposer.pipe(
      fs.createWriteStream(`${pathFolder}/${new Date().getTime()}.eml`)
    );
    console.log('--------- EMIAL IN FILE-----------')

    return true;
  } catch (err) {
    throw new AppError(err.message);
  }
};

const compileTemplate = async (template, data, options = {}) => {
  try {
    const file = path.join(srcPath(`templates/mail/${template}.ejs`));

    if (!file) {
      throw new AppError(
        `Could not find template: ${template} in path: ${file}`
      );
    }

    return await ejs.renderFile(file, data, options, (err, result) => {
      if (err) {
        throw new AppError(err.message);
      }
      return result;
    });
  } catch (err) {
    throw new AppError(err.message);
  }
};

/* eslint no-param-reassign: ["error", { "props": false }] */
const send = async data => {
  try {
    let htmlEmail= draftMail(data);
    let message = {
      from: config.mail.from,
      to: data.email,
      subject: data.subject,
      text: '',
      html:htmlEmail
    };

    transporter.sendMail(message, (err, info) => {
      console.log('\x1b[36m%s\x1b[0m', 'email sending... !');
      console.log('\x1b[32m%s\x1b[0m', 'error', err);
    });

    // return await mailgun.messages().send(data);

  } catch (err) {
    logger.error(err.message, { type: "EMAIL_ERROR", data });

    throw new AppError(err.message);
  }
};

const sendWithDraft = async (data) => {
  try {
    
    console.log('\x1b[36m%s\x1b[0m', 'configuring email');

    return await send(data);
  } catch (err) {
    throw new AppError(err.message);
  }
};

const sendWithTemplate = async (data, templateOptions) => {
  try {
    const template = templateOptions.template || "";
    const dataTemplate = templateOptions.data || {};
    const options = templateOptions.options || {};
    console.log(template)
    console.log(dataTemplate)
    console.log(options)
    if (!template) {
      throw new AppError(`Could not find template name in options`);
    }

    data.html = await compileTemplate(template, dataTemplate, options);

    return await send(data);
  } catch (err) {
    throw new AppError(err.message);
  }
};

export default { send, sendWithTemplate,sendWithDraft };
