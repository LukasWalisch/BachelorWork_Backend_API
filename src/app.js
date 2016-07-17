import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import index from './routes/index';

let expressVar = express();

expressVar.set('views', path.join(__dirname,'views'));
expressVar.set('view engine','jade');


expressVar.use(logger('dev'));
expressVar.use(bodyParser.json());
expressVar.use(bodyParser.urlencoded({extended: true}));
expressVar.use(cookieParser());
expressVar.use(express.static('../public'));

expressVar.use('/api', index); //Switch the name of the path if needed

export default expressVar

