const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch {}

const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Relay listening on http://localhost:${PORT}`);
});
