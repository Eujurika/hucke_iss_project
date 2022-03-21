import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { router as satelliteRouter } from './satellite/index.js';

dotenv.config();
const app = express();
console.log(process.env.SERVER_PORT);
console.log(process.env.SERVER_URL);

app.use(cors());

// zum laden statischer Inhalte
app.use(express.static(`${dirname(fileURLToPath(import.meta.url))}/public`));

const accessLogStream = createWriteStream('access.log', { flags: 'a' });
app.use(morgan('common', { immediate: true, stream: accessLogStream }));

//
app.use('/satellite', satelliteRouter);

app.listen(8080, () => {
  /* console.log('Server is listening to http://localhost:8080'); */
  console.log(
    `Server is listening on ${process.env.SERVER_URL}:${process.env.SERVER_PORT}`
  );
});
