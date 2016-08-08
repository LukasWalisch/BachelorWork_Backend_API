import Tactic from '../model/tactic'
import Pattern from '../model/pattern'
import express from 'express'
import mongoose from 'mongoose';
import Mapping from '../model/mapping';
import 'babel-polyfill';
import async from 'async';
import Bluebird from 'bluebird';
import JSONConverter from '../middleware/JSONConverter';
import helper from '../middleware/helper';
import User from '../model/user';

let router = express.Router();

//========== Patterns ==========//

router.delete('/test',(req,res)=>{
	console.log("test");
	res.json({"ok":"ok"});
});

router.delete('/patterns',(req,res)=>{

	mongoose.Promise = Bluebird;

	//if somewhere an error occurs, this String is filled with the data.
	let errorString = "";

	//This is the ID of the Pattern that needs to be deleted in die related Patterns
	let patternId = req.body.pattern_id || req.params.pattern_id || req.query['pattern_id'] || null;

	if (!patternId) res.json(JSONConverter.convertJSONError("Wrong Params, pattern_id not found",400));

	//Without this Mongo would find the right Pattern, it Changes the String to an ObjectID.
	var patternObjectId = mongoose.Types.ObjectId(patternId);
	let promise = Pattern.findById({_id : patternId}).exec();
	promise.then(function(doc){
		if (doc.length === 0) return res.json(JSONConverter.convertJSONError("No pattern found", 404));
		let relatedPatternArray = doc.relatedPatternIds;
		let promiseRelatedPatternArray = relatedPatternArray.map((item) =>{
			return new Bluebird((resolve,reject)=>{

				patternObjectId = mongoose.Types.ObjectId(patternObjectId);
				Pattern.findByIdAndUpdate(item, {$pull: {relatedPatternIds: patternObjectId}},(err,result)=>{
					if (err) {
						reject(err);
					}
					console.log(result);
					resolve();
				});
			});
		});
		//Loop through the complete array and wait for all Querys to be finished.
		Bluebird.all(promiseRelatedPatternArray)
			.catch((err)=>{
				errorString += "Error: " + err + " ";
			});
		//Delete all Mappings related to this Pattern.
		let mappingIdArray = doc.mappingIds;
		let mappingIdArrayPromise = mappingIdArray.map((item)=>{
			return deleteMapping(item.toString());
		});
		Bluebird.all(mappingIdArrayPromise).catch((reject)=>{
			errorString += "Error: " + reject + " ";
		})
		//Delete the Pattern itself.
	}).then(()=>{
		/*Pattern.findById(patternObjectId.toString()).remove((err)=>{
			if(err) errorString += "Error: " + err.message + " ";

			if (errorString.length <= 0) res.json(JSONConverter.convertJSONError(errorString))
			else*/ res.json(JSONConverter.convertJSONObject("done",{name : "delete", message : "All Ok"}));
		/*});*/
	});
});

//========== Tactics ==========//

router.delete('/tactics/:tactic_id',helper.checkExistingTactic,(req,res)=>{

	//Get the tacticId from all possible sources.
	let tacticId = req.params.tactic_id || req.body.tactic_id || req.query['tactic_id'];

	//Return if the variable tacticId is not set right.
	if (!tacticId) return res.json(JSONConverter.convertJSONError("tactic_id param not found",404));

	let mainPromise = Tactic.findById(tacticId).exec();
	mainPromise.then((doc)=> {
		let parentTacticId = doc.parentTacticId;
		let childTacticIds = doc.childTacticIds;


	});
})

router.post('/tactics',(req,res)=>{
	let saveTactic = new Tactic();
	saveTactic.name = req.body.name;
	saveTactic.info = req.body.info;

	//if the new tactic is no root tactic
	//new tactic is added as child tactic to the parent tactic
	if (req.body.parentTacticId !== undefined) {
		saveTactic.parentTacticId = req.body.parentTacticId;
		Tactic.findByIdAndUpdate(saveTactic.parentTacticId, {$push: {childTacticIds: saveTactic._id}}).exec();
	}
	else {
		saveTactic.parentTacticId = "";
	}

	//in case the new tactic is no root tactic and there is an array of child tactics,
	// the array of child tactics is removed from parents child tactics,
	if (req.body.childTacticIds !== undefined) {
		saveTactic.childTacticIds = req.body.childTacticIds;
		if (saveTactic.parentTacticId !== "") {
			Tactic.findByIdAndUpdate(saveTactic.parentTacticId, {$pullAll: {childTacticIds: saveTactic.childTacticIds}}).exec();
		}
	}
	else {
		saveTactic.childTacticIds = [];
	}

	saveTactic.save((err, savedObject) => {
		if (err)
			res.send(err);
		else
			res.json(savedObject);
	});
})
//========== Mappings ==========//

router.delete('/mappings',helper.checkExistingMapping,(req,res)=>{
	//TODO Copy from index.js and adjust for ember.js
})

//========= User =========//

router.get('/users', (req,res)=>{
	User.find((err, queryResult) => {
		if (err)
			res.json(JSONConverter.convertJSONError(err));
		else
			res.json(JSONConverter.convertJSONArray("users",queryResult));
	});
})

router.get('/users/:user_id',(req,res)=>{
	let userId = req.params.user_id || req.body.user_id || '';
	User.findById(userId,(err,result)=>{
		//If error occurs, send back the error.
		if (err) res.json(JSONConverter.convertJSONError(err));
		//If no User with Id is found, return User not found error.
		else if (!result) res.json(JSONConverter.convertJSONError("User not found",404));
		else res.json(JSONConverter.convertJSONObject("user",result));

	})
})


//========== Private Functions ==========//
//This functions are used by the REST Methods to work on the data.

function deleteMapping(id){
	return new Bluebird(function(resolve,reject) {
		mongoose.Promise = Bluebird;
		let mappingId = id;
		//Cast the String to an ObjectId so the ID is found in the mappingIds field.
		let mappingIdForPull = mongoose.Types.ObjectId(mappingId);
		let mappingPromise = Mapping.findById({_id : mappingId}).exec();
		mappingPromise.then((doc)=> {
			var promise = [];
			promise.push(Tactic.findByIdAndUpdate(doc.tacticId, {$pull: {mappingIds: mappingIdForPull}}).exec());
			promise.push(Pattern.findByIdAndUpdate(doc.patternId, {$pull: {mappingIds: mappingIdForPull}}).exec());
			Bluebird.all(promise).then(function () {
				let deleteQuery = Mapping.findById({_id : mappingId}).remove((err)=> {
					if (err) reject(err);
					else resolve(200);
				})
			}).catch(e=> {
				reject(e);
			});
		}).catch(e=> {
			return reject(e);
		});
	});
}

export default router
