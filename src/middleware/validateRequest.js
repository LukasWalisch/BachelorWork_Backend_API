import jwt from 'jwt-simple';
import secret from '../config/secret';
import User from '../model/user';
import Bluebird from 'bluebird';
import mongoose from 'mongoose';

//TODO Should be a get User function
function validateUser(username,token){

	return new Bluebird((resolve)=>{
		let promise = User.findOne({'username' : username}).exec();
		promise.then((user)=>{
			if(user.token.token === token) resolve(user);
			else resolve(null);
		})
	})
}


export default function(req,res,next){
	//Check weather the token is in body, query or in the header and set the variable "token".
	let token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || (req.headers['x-access-token']);

	//Check weather the key is in body, query or in the header and sets the variable. The key should be the username.
	let key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];

	//If both variables are set
	if(token && key){
		try {
			let decoded = jwt.decode(token, secret());
			if (decoded.exp <= Date.now()) {
				//If token is expired.
				res.status(400);
				res.json({
					"status": 400,
					"message": "Token Expired"
				});
				return;
			}

			//Authorize User

			let userPromise = validateUser(key,token);
			userPromise.then((user)=> {
				if (user) {
					//If there is an "admin" in the url, check if the user is an admin to authorized
					//If there is an /user in the url, check if the user exists
					if ((req.url.indexOf('admin') >= 0 && user.role == 'admin') || (req.url.indexOf('admin') < 0 && req.url.indexOf('/user/') >= 0)) {
						next()
					} else {
						//User is not an admin
						res.status(403);
						res.json({
							"status": 403,
							"message": "Not authorized!"
						});
						return;
					}
				} else {
					//No user with this name exists
					res.status(401);
					res.json({
						"status": 401,
						"message": "Invalid User"
					});
					return;
				}
			});
			}catch (err){
				res.status(500);
				res.json({
					"status": 500,
					"message": "Something went wrong",
					"error": err
				});
			}
	}else {
		res.status(401);
		res.json({
			"status": 401,
			"message": "Invalid Token or Key"
		});
		return;
	}
};
