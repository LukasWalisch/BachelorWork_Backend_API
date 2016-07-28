import express from 'express';
import jwt from 'jwt-simple';

let router = express.Router();

router.post('/',function(req,res){

	//Retrive username and password from body or set it empty.
	var username = req.body.username || '';
	var password = req.body.password || '';

	//Check if the username, password is set right
	if(username == ''|| password == ''){
		res.status(401);
		res.json({
			"status" : 401,
			"message": "Invalid credentials"
		});
		return;
	}

	//Hardcoded credentials for testing
	//TODO Add users in model and check if users exists
	if (username == 'admin' && password == 'admin'){
		//TODO Validate an Admin and set an User Object
		res.json(genToken('admin'));
	}else if (username == 'user' && password == 'user') {
		//TODO Validate an User and set an User Object
		res.json(genToken('user'));
	}else {
		res.status(401);
		res.json({
			"status" : 401,
			"message" : "Invalid credentials"
		});
		}
});


function genToken(user){
	var expires = expiresIn(7);
	var token = jwt.encode({
		exp : expires
	}, require('./config/secret.js'),'HS512',({}));

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

export default router;
