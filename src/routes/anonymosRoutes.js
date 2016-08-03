import jwt from 'jwt-simple';
import Tactic from '../model/tactic'
import Pattern from '../model/pattern'
import express from 'express'
import mongoose from 'mongoose';
import Mapping from '../model/mapping';
import 'babel-polyfill';
import JSONConverter from '../middleware/JSONConverter';
import secret from '../config/secret';
import User from '../model/user';
import Bluebird from 'bluebird';

let router = express.Router();

//========== LOGIN ==========//
//Sends back a Token for a registered User so he can access the Methods in registeredRoutes.
//Needs to helper functions genToken and expiresIn to operate.

function genToken(){
	var expires = expiresIn(7); //Sets the expirationtime to seven Days (time not final)
	//Token is generated through jwt. Its saves the expiration time and hashes it with a secret which is capsuled from the method.
	var token = jwt.encode({
		exp : expires
	}, secret());

	//Returns the token, the expired time and the user who generated it.
	return {
		token: token,
		expires: expires,
	}
}
/*
 Returns a future Date with numDays in the future.
 */
function expiresIn(numDays){
	var dateObj = new Date();
	return dateObj.setDate(dateObj.getDate() + numDays);
}
//Uncomment if you need a new admin for testing.
router.post("/makeAdmin",(req,res)=>{
	var newUser = new User();
	newUser.username = "admin";
	newUser.password = "admin";
	newUser.role = "admin";
	newUser.save((err, result)=>{
		if (err) res.json(err);
		res.json(result);
	})
})


router.post("/login",(req,res)=> {
	//Retrive username and password from body or set it empty.
	//TODO Change this if querys are needed for EmberJS.
	var username = req.body.username || '';
	var password = req.body.password || '';

	//Check if the username, password is set right
	if (username == '' || password == '') {
		res.status(401);
		res.json({errors : {
			"status": 401,
			"message": "Invalid credentials"
		}});
		return;
	}

	//Set Bluebird for mongoose default Promise library.
	mongoose.Promise = Bluebird;
	var promise = User.findOne({'username' : username}).exec();
	promise.then((user)=>{
		//If no user is found, retun an errormessage.
		if (!user){
			res.json(JSONConverter.convertJSONError("Username or Password wrong"));
		}
		//Validate the password if its the right password, send exactly the same Errormessage as above if Password doesnt check.
		user.validatePassword(password,(err, isMatch)=>{
			console.log("isMatch: " + isMatch);
			if(err) res.json(JSONConverter.convertJSONError(err));
			else if(isMatch){
				//Build the User that should be return only with neccasary Props.
				let returnUser = {
					username: user.username,
					token : {
						token: user.token.token,
						expires : user.token.expires
					},
					comments : user.comments,
					ratedMappings: user.ratedMappings
				};
				let token = genToken();
				user.token = token;
				user.save();
				res.json(JSONConverter.convertJSONObject("user", returnUser));
			}else
			{
				res.json(JSONConverter.convertJSONError("Username or Password wrong"));
			}
		});
	})
});

//========== Patterns ==========//
//The Following Methods are alle GET Methods that returns an array of patterns or a single pattern
//If an id is needed, its always <name>_id in params/body.

//GET Method to retrieve all patterns that are saved to the db.
router.get("/patterns",(req,res)=>{
	Pattern.find((err, queryResult) => {
		if (err)
			res.json(JSONConverter.convertJSONError(err));
		else
			//console.log({}.toString.call(queryResult).split(' ')[1].slice(0, -1).toLowerCase());
			res.json(JSONConverter.convertJSONArray("pattern",queryResult));
	});
});


//GET Method to retrieve a single Pattern by Id.
router.get("/patterns/:pattern_id",(req,res)=>{
	Pattern.findById(req.params.pattern_id, (err, queryResult) => {
		if (err)
			res.json(JSONConverter.convertJSONError(err));
		else
			res.json(JSONConverter.convertJSONObject("pattern",queryResult));
	});
});

//========== Tactics ==========//
//The Following Methods are alle GET Methods that returns an array of tactics or a single tactic
//If an id is needed, its always <name>_id in params/body.

router.get("/tactics",(req,res)=>{
	Tactic.find((err, queryResult) => {
		if (err)
			res.json(JSONConverter.convertJSONError(err));
		else
			res.json(JSONConverter.convertJSONArray("tactics",queryResult));
	});
});

router.get("/tactics/:tactic_id",(req,res)=>{
	Tactic.findById(req.params.tactic_id, (err, queryResult) => {
		if (err)
			res.json(JSONConverter.convertJSONError(err));
		else
			res.json("tactic", JSONConverter.convertJSONObject("tactic",queryResult));
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
				res.json(JSONConverter.convertJSONError(err));
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
		res.json(JSONConverter.convertJSONError("query not avaiable"));
}

});

router.get("/mappings/:mapping_id",(req,res)=>{
	Mapping.findById(req.params.tactic_id, (err, queryResult) => {
		if (err)
			res.json(JSONConverter.convertJSONError(err));
		else
			res.json("tactic", JSONConverter.convertJSONObject("tactic",queryResult));
	});
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
