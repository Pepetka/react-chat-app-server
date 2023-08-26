import express from 'express';
import AppConfig from './config/app.js';

const app = express();
const server = new AppConfig(app);
server.initializeApp(app);

export default server;
