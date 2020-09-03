const apiKey = process.env.API_KEY_MAILGUN;
const domain = process.env.DOMAIN_MAILGUN;
const from = process.env.FROM_DEFAULT_MAIL;
const password = process.env.EMAIL_PASSWORD
export default {
  apiKey,
  domain,
  from,
  password
};
