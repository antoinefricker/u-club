import app from './app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  const mailpitUrl = process.env.MAILPIT_URL || 'http://localhost:8025';
  console.log(`API listening on http://localhost:${port}`);
  console.log(`API docs available at http://localhost:${port}/api-docs`);
  console.log(`Mailpit inbox at ${mailpitUrl}`);
});
