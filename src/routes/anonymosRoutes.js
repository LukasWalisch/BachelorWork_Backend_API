import jwt from 'jwt-simple';
import Tactic from '../model/tactic'
import Pattern from '../model/pattern'
import express from 'express'
import 'mongoose';
import Mapping from '../model/mapping';
import 'babel-polyfill';
import JSONConverter from '../middleware/JSONConverter';
import secret from '../config/secret';

let router = express.Router();

//========== LOGIN ==========//
//Sends back a Token for a registered User so he can access the Methods in registeredRoutes.
//Needs to helper functions genToken and expiresIn to operate.

function genToken(user){
	var expires = expiresIn(7); //Sets the expirationtime to seven Days (time not final)
	//Token is generated through jwt. Its saves the expiration time and hashes it with a secret which is capsuled from the method.
	var token = jwt.encode({
		exp : expires
	}, secret());

	//Returns the token, the expired time and the user who generated it.
	return {
		token: token,
		expires: expires,
		user: user
	}
}
/*
 Returns a future Date with numDays in the future.
 */
function expiresIn(numDays){
	var dateObj = new Date();
	return dateObj.setDate(dateObj.getDate() + numDays);
}

router.post("/login",(req,res)=> {
	//Retrive username and password from body or set it empty.
	var username = req.body.username || '';
	var password = req.body.password || '';

	//Check if the username, password is set right
	if (username == '' || password == '') {
		res.status(401);
		res.json({
			"status": 401,
			"message": "Invalid credentials"
		});
		return;
	}

	//Hardcoded credentials for testing
	//TODO Add users in model and check if users exists
	if (username == 'admin' && password == 'admin') {
		//TODO Validate an Admin and set an User Object
		res.json(genToken('admin'));
	} else if (username == 'user' && password == 'user') {
		//TODO Validate an User and set an User Object
		res.json(genToken('user'));
	} else {
		res.status(401);
		res.json({
			"status": 401,
			"message": "Invalid credentials"
		});
	}
});

//========== Patterns ==========//
//The Following Methods are alle GET Methods that returns an array of patterns or a single pattern
//If an id is needed, its always <name>_id in params/body.

//GET Method to retrieve all patterns that are saved to the db.
router.get("/patterns",(req,res)=>{
	Pattern.find((err, queryResult) => {
		if (err)
			res.send(err);
		else
			//console.log({}.toString.call(queryResult).split(' ')[1].slice(0, -1).toLowerCase());
			res.json(JSONConverter.convertJSONArray("pattern",queryResult));
	});
});


//GET Method to retrieve a single Pattern by Id.
router.get("/patterns/:pattern_id",(req,res)=>{
	Pattern.findById(req.params.pattern_id, (err, queryResult) => {
		if (err)
			res.send(err);
		else
			res.json(JSONConverter.convertJSONArray("pattern",queryResult));
	});
});

//========== Tactics ==========//
//The Following Methods are alle GET Methods that returns an array of tactics or a single tactic
//If an id is needed, its always <name>_id in params/body.

router.get("/tactics",(req,res)=>{
	Tactic.find((err, queryResult) => {
		if (err)
			res.send(err);
		else
			res.json(JSONConverter.convertJSONArray("tactics",queryResult));
	});
});

router.get("/tactics/:tactic_id",(req,res)=>{
	Tactic.findById(req.params.tactic_id, (err, queryResult) => {
		if (err)
			res.send(err);
		else
			res.json(queryResult);
	});
});

//========== Mappings ==========//
//The Following Methods are alle GET Methods that returns an array of mappings or a single mapping
//If an id is needed, its always <name>_id in params/body.

//GET method for queries. delegates the request to a function depending on the query params
router.get("/mappings", (req, res) => {
	const queryParams = req.query;

	//if it is a request without query, this method returns all entries of mappings
	if (Object.keys(queryParams).length === 0){
		Mapping.find((err, queryResult)=> {
			if (err)
				res.send(err);
			else
				res.json(JSONConverter.convertJSONArray('mappings', queryResult));
		});
	}

	//Query: getMappingsByPatternId
	else if ('patternId' in queryParams) {
		getMappingsByPatternId(queryParams, req, res);
	}

	// if query params dont match, send back an error msg
	else {
		res.json({err: "query is not available"});
}

});

//query functions

function getMappingsByPatternId (queryParams, req, res) {
	//query for mappings with patternId
	Mapping.find({patternId: queryParams.patternId}, (err, result) => {
		if (err){
			res.send(err);
		}
		else {
			res.json(JSONConverter.convertJSONArray('mappings',result));
		}
	});
}




export default router;
