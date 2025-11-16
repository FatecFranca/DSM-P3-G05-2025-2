const express = require('express');
const cors = require('cors');

const errorHandler = require('./middlewares/errorHandler');

// Rotas
const categoryRoutes = require('./routes/categoryRoutes');
const placeRoutes = require('./routes/placeRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
app.use(express.json());

// Configuração do CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '')
	.split(',')
	.map((o) => o.trim())
	.filter(Boolean);

const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (like mobile apps, curl, Postman) or when no restriction is set
		if (!origin || allowedOrigins.length === 0) return callback(null, true);
		if (allowedOrigins.includes(origin)) return callback(null, true);
		return callback(new ApiError(403, 'Not allowed by CORS'));
	},
	methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
	credentials: true,
	optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));


// Usar rotas
app.use('/categories', categoryRoutes);
app.use('/estabelecimentos', placeRoutes);
app.use('/comments', commentRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;