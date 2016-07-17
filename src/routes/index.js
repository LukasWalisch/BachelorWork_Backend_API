//All Paths have the rootpath "/api".
import Tactic from '../model/tactic'
import Pattern from '../model/pattern'
import express from 'express'
import mongoose from 'mongoose'
import Mapping from '../model/mapping';
import 'babel-polyfill'
import async from 'async'


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
        saveTactic.mappingIds = req.body.mappingIds;
        saveTactic.childTacticIds = req.body.childTacticIds;
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

		//relatedPatternIds are only added when the related patterns do exist in the database
        savePattern.relatedPatternIds = [];

		//synchronize fetching after relatedpattern and save the pattern

		// loop to query for all related Pattern
		// has to be synchronized because there is a callback inside the loop
		let index = 0;
		async.whilst(
			function testCondition(){return index < req.body.relatedPatternIds.length;},
			function increaseCounter(loopCallback){

				//execute mongoose query
				Pattern.findByIdAndUpdate(req.body.relatedPatternIds[index], {$push: {relatedPatternIds: savePattern._id}}, (err, updateObject) => {
					if (!err){
						savePattern.relatedPatternIds.push(req.body.relatedPatternIds[index]);
					}

					//increment and call the next iteration of the loop via callback
					index++;
					loopCallback();
				});
			},
			function (){
				savePattern.save((err, savedObject) => {
				if (err)
					res.send(err);
				else
					res.json(savedObject);
			});}
		);
        // patternIds are igored cause they are managed by another function
    });


router.route('/pattern/:pattern_id')
    
    .get((req,res)=>{
        Pattern.findById(req.params.pattern_id, (err, queryResult) => {
            if (err)
                res.send(err);
            else
                res.json(queryResult);
        });
    })

    .put((req,res)=>{

        res.statusMessage = "";
        // find the object with the request id
        let updatePattern = {}; //type will be Pattern
        Pattern.findById(req.params.pattern_id, (err, foundObject) => {
            if (err)
                res.statusMessage += "Pattern id not found!";
            else
                updatePattern = foundObject;
        });

        //set the values of request
        if (req.body.name !== undefined)
            updatePattern.name = req.body.name;

        if (req.body.info !== undefined)
            updatePattern.info = req.body.info;

        for (let relatedPatternId of req.body.relatedPatternIds){
            Pattern.findByIdAndUpdate(relatedPatternId, {$push: {relatedPatternIds: updatePattern._id}}, (err, updateObject) => {
                if (!err){
					savePattern.push(updatePattern.relatedPatternIds);
                    //res.statusMessage += "Error: RelatedPatternId " + relatedPatternId + " does not exist!\n";
                }

            });
        }
        // patternIds are igored cause they are managed by another function

        //save updatedPattern in database
        updatePattern.save((err, updateObject) => {
            if (err)
                res.send(err);
            else
                res.json(updateObject);
        });
    });

router.route('/tactic/:tactic_id')
    
    .get((req,res)=>{
        Tactic.findById(req.params.tactic_id, (err, queryResult) => {
            if (err)
                res.send(err);
            else
                res.json(queryResult);
        });
    })

    .put((req,res)=>{
        Tactic.findByIdAndUpdate(req.params.tactic_id, {$set: req.body}, (err, queryResult) => {
            if (err)
                res.send(err);
            else
                res.send(queryResult);
        })

    });

router.get('/mappingsByPatternId/:id',(req,res)=>{
   //TODO List of all mapped Tactics to given Pattern by ID
});

router.get('/mappingsByTacticId/:id',(req,res)=>{
   //TODO List of all mapped Patterns to given Tactic by ID
});

router.get('/relatedPatternFromId/:id',(req,res)=>{
    //TODO Get all related Patterns from given Pattern by ID
});


router.post('/mapping',checkExistingPattern, checkExistingTactic, (req,res)=>{
    let saveMapping = new Mapping();
    let patternId = req.body.patternId;
    let tacticId = req.body.tacticId;
    saveMapping.patternId = patternId;
    saveMapping.tacticId = tacticId;
    //TODO Update Pattern und Tactic Info and save Mapping


});



function checkExistingTactic (req,res,next){
    let tacticId = req.body.tacticId;
    Tactic.count({_id: tacticId}, (err,count)=>{
        if(err){
            res.statusCode()
            res.send(err);
        }else
        if(count <= 0){
            res.json({error:"Error, Tactic not found"});
        }else {
            next();
        }
    });
}

function checkExistingPattern (req,res,next) {
    let patternId = req.body.patternId;
    Pattern.count({_id: patternId}, (err,count)=>{
        if(err){
            res.send(err);
        }else
        if(count <= 0){
            res.json({error:"Error, Pattern not found"});
        }else {
            next();
        }
    });
}

export default router
