require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

require('./utils/firebase');

const authRouter   = require('./routes/auth');
const userRouter   = require('./routes/user');
const skillsRouter = require('./routes/skills');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/skills', skillsRouter);

app.get('/', (req, res) => res.send('API is up'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
