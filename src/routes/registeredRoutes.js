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

let router = express.Router();

//========== Patterns ==========//

router.post('/patterns',(req,res)=> {
	//TODO Copy from index.js and adjust for ember.js
});


//========== Tactics ==========//

router.post('/tactics',(req,res)=>{
	//TODO Copy from index.js and adjust for ember.js
})

//========== Mappings ==========//


router.post('/mappings',helper.checkExistingPattern,helper.checkExistingTactic,(req,res)=>{
	//TODO Copy from index.js and adjust for ember.js
})





export default router
