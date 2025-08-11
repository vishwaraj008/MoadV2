const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const generateDocsRoute = require('./src/routes/routes');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/generate-docs', generateDocsRoute);
app.get("/", (req, res) => {
    res.send("Welcome to MOAD")
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));