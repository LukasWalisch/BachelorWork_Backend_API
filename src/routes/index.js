//All Paths have the rootpath "/api".
import Tactic from '../model/tactic'
import Pattern from '../model/pattern'
import express from 'express'
import mongoose from 'mongoose'
import Mapping from '../model/mapping';
import 'babel-polyfill';
import async from 'async';
import Bluebird from 'bluebird';


let router = express.Router();

//database connection
mongoose.connect('mongodb://localhost:27017');

router.route('/tactic')
	.get((req, res) => {
		Tactic.find((err, queryResult) => {
			if (err)
				res.send(err);
			else
				res.json(queryResult);
		});
	})
	.post((req, res) => {
		let saveTactic = new Tactic();
		saveTactic.name = req.body.name;
		saveTactic.info = req.body.info;

		//if the new tactic is no root tactic
		//new tactic is added as child tactic to the parent tactic
		if (req.body.parentTacticId !== undefined) {
			saveTactic.parentTacticId = req.body.parentTacticId;
			Tactic.findByIdAndUpdate(saveTactic.parentTacticId, {$push: {childTacticIds: saveTactic._id}});
		}
		else {
			saveTactic.parentTacticId = "";
		}

		//in case the new tactic is no root tactic and there is an array of child tactics,
		// the array of child tactics is removed from parents child tactics,
		if (req.body.childTacticIds !== undefined) {
			saveTactic.childTacticIds = req.body.childTacticIds;
			if (saveTactic.parentTacticId !== "") {
				Tactic.findByIdAndUpdate(saveTactic.parentTacticId, {$pullAll: {childTacticIds: saveTactic.childTacticIds}});
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
	});

router.route('/pattern')

	.get((req, res) => {

		Pattern.find((err, queryResult) => {
			if (err)
				res.send(err);
			else
				res.json(queryResult);
		});
	})

	.post((req, res) => {
		let savePattern = new Pattern();
		savePattern.name = req.body.name;
		savePattern.info = req.body.info;

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
						res.send(err);
					else
						res.json(savedObject);
					callback();
				});
			}
		]);
		// patternIds are igored cause they are managed by another function
	});


router.route('/pattern/:pattern_id')

	.get((req, res)=> {
		Pattern.findById(req.params.pattern_id, (err, queryResult) => {
			if (err)
				res.send(err);
			else
				res.json(queryResult);
		});
	})

	.delete(checkExistingPattern,(req,res)=>{
		mongoose.Promise = Bluebird;
		//This is the ID of the Pattern that needs to be deleted in die related Patterns
		var patternObjectId = mongoose.Types.ObjectId(req.params.pattern_id);
		let promise = findPatternByIdQuery(req.params.pattern_id).exec();
		promise.then(function(doc){
			//Gather all IDs from the Patterns which threw an error und try again later.
			var gatherErrorIDs = [];
			let relatedPatternArray = doc.relatedPatternIds;
			let promiseRelatedPatternArray = relatedPatternArray.map((item) =>{
				return new Bluebird((resolve)=>{
					//Update the relatedID field, add it to gatherErrorIDs if something happends
					patternObjectId = mongoose.Types.ObjectId(patternObjectId);
					Pattern.findByIdAndUpdate(item, {$pull: {relatedPatternIds: patternObjectId}},(err,result)=>{
						if (err) {
							gatherErrorIDs.push(item);
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
					console.log("Gathered Errors: " + gatherErrorIDs);
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

			//TODO Delete Pattern itself.
		}).then(()=>{
			console.log("Delete this shit");
			Pattern.findById(patternObjectId.toString()).remove((err)=>{
				if(err) res.send(err);
				else res.json({"ok":"ok"});
			});
		});
	})

	.put((req, res)=> {

		// find the object with the request id
		let updatePattern = {}; //type will be Pattern
		Pattern.findById(req.params.pattern_id, (err, foundObject) => {
			if (err)
				res.statusMessage += "Pattern id not found!";
			else
				updatePattern = foundObject;
		});

		//change only the values in the pattern which are set in the request
		if (req.body.name !== undefined)
			updatePattern.name = req.body.name;

		if (req.body.info !== undefined)
			updatePattern.info = req.body.info;

		if (req.body.relatedPatternIds === undefined)
			req.body.relatedPatternIds = [];

		if (updatePattern.relatedPatternIds === undefined)
			updatePattern.relatedPatternIds = [];

		//synchronous series: update relatedPatternIds and save updatedPattern
		//similar to post method of /patterns
		async.series([
			function updateRelatedPatternIds(callback) {
				let index = 0;
				async.whilst(
					function testCondition() {
						return index <= req.body.relatedPatternIds.length;
					},
					function iteration(callback) {
						Pattern.findByIdAndUpdate(
							req.body.relatedPatternIds[index],
							{$push: {relatedPatternIds: updatePattern._id}},
							(err, updateObject) => {
								if (!err && updateObject !== null){
									const relatedPatternObjectId = mongoose.Types.ObjectId(req.body.relatedPatternIds[index]);
									updatePattern.push(relatedPatternObjectId);
								}
								index++;
								callback();
							});
					},
					function () {
						callback();
					}
				)
			},
			function saveUpdatedPattern(callback) {
				updatePattern.save((err, updateObject) => {
					if (err)
						res.send(err);
					else
						res.json(updateObject);
					callback();
				});
			}
		]);

		// patternIds are igored cause they are managed by another function

	});

router.route('/tactic/:tactic_id')

	.get((req, res)=> {
		Tactic.findById(req.params.tactic_id, (err, queryResult) => {
			if (err)
				res.send(err);
			else
				res.json(queryResult);
		});
	})

	.put((req, res)=> {
		Tactic.findByIdAndUpdate(req.params.tactic_id, {$set: req.body}, (err, queryResult) => {
			if (err)
				res.send(err);
			else
				res.send(queryResult);
		})

	});



router.get('/mappingsByPatternId/:pattern_id',checkExistingPattern, (req, res)=> {
	let patternQuery = findPatternByIdQuery(req.params.pattern_id);
	patternQuery.exec(function (err,result){
		if(err) res.send(err)
		else{
			let IdArray = result.mappingIds;
			Mapping.find({
				_id : { $in : IdArray}
			}, function (err, docs){
				if (err) res.send(err)
				else res.json(docs)
			});
		}
	});
});


router.get('/mappingsByTacticId/:tactic_id',(req,res)=>{
   let tacticQuery = findTacticbyIdQuery(req.params.tactic_id);
	tacticQuery.exec(function(err,result){
		if(err) res.status(500).send(err)
		else{
			let IdArray = result.mappingIds;
			Mapping.find({
				_id : { $in : IdArray}
			},function (err, docs){
				if (err) res.status(500).send(err)
				else res.json(docs)
			});
		}
	});
});

router.get('/relatedPatternFromId/:pattern_id',checkExistingPattern,(req,res)=>{
	let patternQuery = findPatternByIdQuery(req.params.pattern_id);
	patternQuery.exec(function(err,result){
		if (err) res.status(500).send(err)
		else{
			let IdArray = result.relatedPatternIds;
			Pattern.find({
				_id : { $in : IdArray}
			},function(err, docs){
				if(err) res.status(500).send(err)
				else res.json(docs)
			});
		}
	});
});

router.get('/childTaticsFromId/:tactic_id',checkExistingTactic,(req,res)=>{
	//TODO Get all children Tactics from given Tactic ID
	let tacticQuery = findTacticByIdQuery(req.params.tactic_id);
	tacticQuery.exec(function(err,result){
		if(err) res.status(500).send(err)
		else{
			let IdArray = result.childTacticIds;
			Tactic.find({
				_id : { $in : IdArray}
			},function(err, docs){
				if(err) res.status(500).send(err)
				else res.json(docs)
			});
		}
	});
});

router.get('/mapping', (req, res)=> {
	Mapping.find((err, queryResult)=> {
		if (err)
			res.send(err);
		else
			res.json(queryResult);
	})
})

router.post('/mapping', checkExistingPattern, checkExistingTactic, function (req, res) {
	mongoose.Promise = Bluebird;
	let saveMapping = new Mapping();
	let patternId = req.body.pattern_id;
	let tacticId = req.body.tactic_id;
	let info = req.body.info;
	//TODO Add Rating/Comments
	saveMapping.patternId = patternId;
	saveMapping.tacticId = tacticId;
	saveMapping.info = info;
	let mappingId = saveMapping._id;
	console.log(saveMapping);
	var promise = [];
	promise.push(Tactic.findByIdAndUpdate(tacticId,{$addToSet: {mappingIds: mappingId}}).exec());
	promise.push(Pattern.findByIdAndUpdate(patternId,{$addToSet: {mappingIds: mappingId}}).exec());
	Bluebird.all(promise)
		.then(function() {
			saveMapping.save((err, result)=> {
				if (err) {
					res.statusCode = 500;
					res.setStatusMessage = err;
				} else res.json(result)
			})
			console.log("saved");
		})
		.catch(function(err){
			console.log("error" + err);
			res.send(err);
		})
});

router.delete('/mapping/:mapping_id', checkExistingMapping, (req,res)=>{


	let promise = deleteMapping(req.params.mapping_id);
	promise
		//If the resolve is set, then is triggered
		.then((resolve)=>{
			res.status(resolve).send();
		})
		// If the reject is set, catch is triggered
		.catch((reject)=>{
			res.status(500).send(reject);
		})
	/*
		mongoose.Promise = Bluebird;
		let mappingId = req.params.mapping_id;
		let mappingIdForPull = mongoose.Types.ObjectId(mappingId);
		let mappingPromise = findMappingByIdQuery(mappingId).exec();
		mappingPromise.then((doc)=> {
			var promise = [];
			promise.push(Tactic.findByIdAndUpdate(doc.tacticId, {$pull: {mappingIds: mappingIdForPull}}).exec());
			promise.push(Pattern.findByIdAndUpdate(doc.patternId, {$pull: {mappingIds: mappingIdForPull}}).exec());
			Bluebird.all(promise).then(function () {
				let deleteQuery = findMappingByIdQuery(mappingId).remove((err)=> {
					if (err) res.status(500).send(err)
					else res.status(200).send();
				})
			}).catch(e=> {
				res.status(500).send(e);
			});
		}).catch(e=> {
			res.status(500).send(e);
		})*/
});


//Helper Function Section:
function checkExistingTactic (req,res,next){
    let tacticId = req.body.tactic_id;
	if (tacticId === undefined) tacticId = req.params.tactic_id;
    Tactic.count({_id: tacticId}, (err,count)=>{
        if(err){
            res.status(500).send(err);
        }else
        if(count <= 0){
            res.json({error:"Error, Tactic not found"});
        }else {
            next();
        }
    });
}

function checkExistingPattern (req,res,next) {
    let patternId = req.body.pattern_id;
	if (patternId === undefined) patternId = req.params.pattern_id;
    Pattern.count({_id: patternId}, (err,count)=>{
        if(err){
        	res.status(500).send(err);
        }else
        if(count <= 0){
            res.json({error:"Error, Pattern not found"});
        }else {
            next();
        }
    });
}

function checkExistingMapping(req,res,next){
	let mappingId = req.body.mapping_id;
	if(mappingId === undefined) mappingId = req.params.mapping_id;
	Mapping.count({_id: mappingId}, (err,count)=>{
		if(err){res.status(500).send(err)}
		else if (count <= 0){
			res.status(404).json({error: "Error, Mapping not found"})
		}else{
			next();
		}
	});
}
/*
	Deletes a Mapping with given id.
	id needs to be a String.
	If you call the function with an ObjectId, convert it first with .toString()
 */
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

/*
	Block of Functions which return a query to find Pattern, Tactic, Mapping by ID.
 */
function findPatternByIdQuery(id) {
	return Pattern.findById(id);
}

function findTacticByIdQuery(id){
	return Tactic.findById(id);
}

function findMappingByIdQuery(id){
	return Mapping.findById(id);
}


export default router
