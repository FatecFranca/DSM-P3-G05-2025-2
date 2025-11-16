const express = require('express');

const errorHandler = require('./middlewares/errorHandler');
// Rotas
const categoryRoutes = require('./routes/categoryRoutes');

const placeRoutes = require('./routes/placeRoutes');

const app = express();
app.use(express.json());

// Usar rotas
app.use('/categories', categoryRoutes);

app.use('/estabelecimentos', placeRoutes);

app.use(errorHandler);

module.exports = app;