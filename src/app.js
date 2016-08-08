import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import index from './routes/index';
import anonym from './routes/anonymosRoutes';
import registred from './routes/registeredRoutes';
import mongoose from 'mongoose';
import validator from './middleware/validateRequest';
import admin from './routes/adminRoutes';
import JSONConverter from './middleware/JSONConverter';

let expressVar = express();
//database connection
mongoose.connect('mongodb://localhost:27017');

/**
expressVar.set('views', path.join(__dirname,'views'));
expressVar.set('view engine','jade');
*/


expressVar.all('/*', function(req,res,next){
	res.header("Access-Control-Allow-Origin","*");
	res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers','Content-Type,Accept,X-Access-Token,X-Key,X-Requested-With');
	next();
});

//TODO Uncomment to activate the validation
//expressVar.all('/user/*',validator);

expressVar.use(logger('dev'));
expressVar.use(bodyParser.json());
expressVar.use(bodyParser.urlencoded({extended: true}));
expressVar.use(cookieParser());
expressVar.use(express.static('../public'));

//TODO Delete /test after index is deleted.
expressVar.use('/test',index);


//=== All Routes used by the RestAPI ===//

//Routes for anonym Users. No Validation/Authorization needed
expressVar.use('/',anonym);

//Routes for registered Users. Token and Validation is required
expressVar.use('/user', registred);

//Routes for administrators. Token, Validation and Authorization is required.
expressVar.use('/user/admin',admin);


expressVar.use(function(req,res,next){
	var err = new Error('Ressource was not found');
	err.status = 404;
	console.log(err);
	next(err);
})

expressVar.use(function(err, req, res, next){
	console.log("ErrorMessage: " + err);
	if(err) res.json(JSONConverter.convertJSONError(err.message,err.status)); //TODO Better Error Handling.
	else res.json(JSONConverter.convertJSONError("Ressource not found",404));
})

export default expressVar

