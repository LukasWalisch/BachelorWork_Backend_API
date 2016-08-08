//Helper Functions for simple Tasks that are requiered at multiple Targets
import Mapping from '../model/mapping';
import Tactic from '../model/tactic';
import Pattern from '../model/pattern';
import express from 'express'
import mongoose from 'mongoose'
import 'babel-polyfill';
import Bluebird from 'bluebird';
import JSONConverter from '../middleware/JSONConverter';

export default{
	//Allows to check for an existing Pattern. If Pattern is not found the process is canceled and an errormessage is send.
	checkExistingPattern(req,res,next){
		let patternId = req.body.pattern_id;
		if (patternId === undefined) patternId = req.params.pattern_id;
		Pattern.count({_id: patternId}, (err,count)=>{
			if(err){
				res.json(JSONConverter.convertJSONError(err))
			}else
			if(count <= 0){
				res.json(JSONConverter.convertJSONError("Pattern not found",404));
			}else {
				next();
			}
		});
	},
	//See checkExistingPattern
	checkExistingTactic(req,res,next){
		let tacticId = req.body.tactic_id;
		if (tacticId === undefined) tacticId = req.params.tactic_id;
		Tactic.count({_id: tacticId}, (err,count)=>{
			if(err){
				res.json(JSONConverter.convertJSONError(err))
			}else
			if(count <= 0){
				res.json(JSONConverter.convertJSONError("Tactic not found",404));
			}else {
				next();
			}
		});
	},
	//See checkExistingPattern
	checkExistingMapping(req,res,next){
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

}
