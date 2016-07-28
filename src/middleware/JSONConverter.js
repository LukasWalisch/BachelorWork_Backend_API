export default {
	convertJSONArray(type, arguments){

	},
	convertJSONObject(type,arguments){
		return{
			"type" : type,
			"id" : arguments._id,
			"arguments" : [JSON.stringify(arguments)]
		}
	}
}
