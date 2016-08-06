import Tactic from '../model/tactic'
import Pattern from '../model/pattern'
import express from 'express'
import 'mongoose'
import Mapping from '../model/mapping';
import 'babel-polyfill';
import async from 'async';
import Bluebird from 'bluebird';
import JSONConverter from '../middleware/JSONConverter';
import helper from '../middleware/helper';
import User from '../model/user';

let router = express.Router();

//========== Patterns ==========//

router.delete('/patterns',helper.checkExistingPattern,(req,res)=>{
	//TODO adjust for ember.js
	mongoose.Promise = Bluebird;
	//This is the ID of the Pattern that needs to be deleted in die related Patterns
	let patternId = "Query from request" //TODO Adjust to the right parameter.
	var patternObjectId = mongoose.Types.ObjectId(patternId);
	let promise = findPatternByIdQuery(patternId).exec();
	promise.then(function(doc){
		//Gather all IDs from the Patterns which threw an error und try again later.
		//var gatherErrorIDs = []; !Not Yet!
		let relatedPatternArray = doc.relatedPatternIds;
		let promiseRelatedPatternArray = relatedPatternArray.map((item) =>{
			return new Bluebird((resolve)=>{
				//Update the relatedID field, add it to gatherErrorIDs if something happends
				patternObjectId = mongoose.Types.ObjectId(patternObjectId);
				Pattern.findByIdAndUpdate(item, {$pull: {relatedPatternIds: patternObjectId}},(err,result)=>{
					if (err) {
						//gatherErrorIDs.push(item); !Not yet!
						console.log(err);
						resolve();
					}
					console.log(result);
					resolve();
				});
			});
		});
		//Loop through the complete array and wait for all Querys to be finished.
		Bluebird.all(promiseRelatedPatternArray)
			.then(function(){
				//console.log("Gathered Errors: " + gatherErrorIDs);
				while(false){
					//TODO Retry the querys if errors happend, look up how its done best practice.
				}
			});
		//Delete all Mappings related to this Pattern.
		let mappingIdArray = doc.mappingIds;
		let mappingIdArrayPromise = mappingIdArray.map((item)=>{
			return deleteMapping(item.toString());
		});
		Bluebird.all(mappingIdArrayPromise).catch((reject)=>{
			console.log("Error deleting Mappings: " + reject);
		})
		//Delete the Pattern itself.
	}).then(()=>{
		Pattern.findById(patternObjectId.toString()).remove((err)=>{
			if(err) res.send(err);
			else res.json({"ok":"ok"});
		});
	});
});

//========== Tactics ==========//

router.delete('/tactics',helper.checkExistingTactic,(req,res)=>{
	//TODO Implement Method
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
		let mappingPromise = findMappingByIdQuery(mappingId).exec();
		mappingPromise.then((doc)=> {
			var promise = [];
			promise.push(Tactic.findByIdAndUpdate(doc.tacticId, {$pull: {mappingIds: mappingIdForPull}}).exec());
			promise.push(Pattern.findByIdAndUpdate(doc.patternId, {$pull: {mappingIds: mappingIdForPull}}).exec());
			Bluebird.all(promise).then(function () {
				let deleteQuery = findMappingByIdQuery(mappingId).remove((err)=> {
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
