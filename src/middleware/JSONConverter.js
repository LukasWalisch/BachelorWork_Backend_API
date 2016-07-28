"use strict";
const JSONConverter = {
	convertJSONObject: function(type, argument){
		return JSON.stringify({
			data: {
				type: type,
				id: argument._id,
				arguments: argument
			}
		})
	},
	convertJSONArray: function(type,argument){
		let finishedArray = [];
		argument.forEach((item)=>{
			let jsonEntry = {
				type : type,
				id : item._id,
				arguments : item
			}
			finishedArray.push(jsonEntry);
		});
		return JSON.stringify({data : finishedArray});
	}
}

export default JSONConverter
