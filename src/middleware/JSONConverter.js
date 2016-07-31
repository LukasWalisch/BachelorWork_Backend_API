/*
Use this functions to convert a Javascript Object to a JSONAPI conform format.
Convert a single Object with the convertJSONObject.
Convert an array Object with the convertJSONArry.
Method returns an error if fields are not set correctly
 */
"use strict";
const JSONConverter = {
	convertJSONObject: function(type, attribute){
		if(type == undefined || attribute == undefined) return {error: "type or attribute of JSONConverter not set"};
		return {
			data: {
				type: type,
				id: attribute._id,
				attributes: attribute
			}
		}
	},
	convertJSONArray: function(type,attribute){
		if(type == undefined || attribute == undefined) return {error: "type or attribute of JSONConverter not set"};
		let dataArray = [];
		attribute.forEach((item)=>{
			let dataArrayEntry = {
				type : type,
				id : item._id,
				attributes : item
			}
			dataArray.push(dataArrayEntry);
		});
		return {data : dataArray};
	}
}

export default JSONConverter
