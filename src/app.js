import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import index from './routes/index';
import authenticator from './routes/authenticator';

let expressVar = express();

expressVar.set('views', path.join(__dirname,'views'));
expressVar.set('view engine','jade');

expressVar.all('/*', function(req,res,next){
	res.header("Access-Control-Allow-Origin","*");
	res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers','Content-Type,Accept,X-Access-Token,X-Key,X-Requested-With');
	next();
});

expressVar.use(logger('dev'));
expressVar.use(bodyParser.json());
expressVar.use(bodyParser.urlencoded({extended: true}));
expressVar.use(cookieParser());
expressVar.use(express.static('../public'));

expressVar.use('/api', index); //Switch the name of the path if needed
expressVar.use('/login',authenticator);

expressVar.use(function(req,res,next){
	var err = new Error('Ressource was not found');
	err.status = 404;
	next(err);
})

expressVar.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(err.status).send(err.stack);
})

export default expressVar

