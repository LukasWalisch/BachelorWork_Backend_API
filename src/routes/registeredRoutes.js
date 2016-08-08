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

let router = express.Router();

//========== Patterns ==========//

router.post('/patterns',(req,res)=> {
	//TODO Copy from index.js and adjust for ember.js
	let savePattern = new Pattern();

	//Look through all three methods how you can pass params in express.
	let name = req.body.name || req.params.name || req.query['name'] || null;
	let info = req.body.info || req.params.info || req.query['info'] || null;

	if (!name || !info)return res.json(JSONConverter.convertJSONError("No Params set or ParamNames wrong",400));

	savePattern.name = name;
	savePattern.info = info;

	if (req.body.relatedPatternIds === undefined)
		req.body.relatedPatternIds = [];

	savePattern.relatedPatternIds = [];

	// execute the tasks synchronously:
	async.series([
		// add relatedPatternIds to the savedPattern if they exist and also add the savePattern to the relatedPatterns
		function (callback) {
			let index = 0;
			async.whilst(
				function testCondition() {
					return index < req.body.relatedPatternIds.length;
				},
				function iteration(callback) {
					//execute queries synchronously
					Pattern.findByIdAndUpdate(req.body.relatedPatternIds[index], {$push: {relatedPatternIds: savePattern._id}}, (err, updateObject) => {
						// if the relatedPatternId from the request is found in the db,
						// it is added to savePattern
						if (!err && updateObject !== null) {

							//format relatedPatternId from post request as Object id
							const relatedPatternObjectId = mongoose.Types.ObjectId(req.body.relatedPatternIds[index]);

							// save the relatedPatternId to savePattern
							savePattern.relatedPatternIds.push(relatedPatternObjectId);
						}
						//increment and call the next iteration of the loop via callback
						index++;
						callback();
					});
				},
				// callback function from async.whilst is called when the testCondition fails
				function () {
					// callback from async.series is called to start the next function of async.series
					callback();
				}
			);
		},
		// save savePattern to database
		function (callback) {
			savePattern.save((err, savedObject) => {
				if (err)
					res.json(JSONConverter.convertJSONError(err));
				else
					res.json(savedObject);
				callback();
			});
		}
	]);
});


//========== Tactics ==========//



//========== Mappings ==========//


router.post('/mappings',helper.checkExistingPattern,helper.checkExistingTactic,(req,res)=>{
	mongoose.Promise = Bluebird;
	let saveMapping = new Mapping();

	//Import all required Params for the next steps or send an error back if some parameters are not set right.
	let patternId = req.body.pattern_id || req.params.pattern_id || req.query['pattern_id'] || null;
	let tacticId = req.body.tactic_id || req.params.tactic_id || req.query['tactic_id'] || null;
	let info = req.body.info || req.params.info || req.query['info'] || null;

	if (!patternId || !tacticId || !info) return res.json(JSONConverter.convertJSONError("Could not find pattern_id, tactic_id or info",400));

	//TODO Add Rating/Comments
	saveMapping.patternId = patternId;
	saveMapping.tacticId = tacticId;
	saveMapping.info = info;
	let mappingId = saveMapping._id;
	var promise = [];
	promise.push(Tactic.findByIdAndUpdate(tacticId,{$addToSet: {mappingIds: mappingId}}).exec());
	promise.push(Pattern.findByIdAndUpdate(patternId,{$addToSet: {mappingIds: mappingId}}).exec());
	Bluebird.all(promise)
		.then(function() {
			saveMapping.save((err, result)=> {
				if (err) {
					res.json(JSONConverter.convertJSONError(err));
				} else res.json(JSONConverter.convertJSONObject("mapping",result));
			})
		})
		.catch(function(err){
			res.json(JSONConverter.convertJSONError(err));
		})
})





export default router
