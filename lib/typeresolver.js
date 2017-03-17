let Path = require('path'),
	fs = require('fs');

let protocolDir = Path.normalize(__dirname+'/../protocols');
let gamesFile = Path.normalize(__dirname+'/../games.txt');

function parseList(str) {
	if(!str) {return {};}
	let split = str.split(',');
	let out = {};
	split.forEach((one) => {
		let equals = one.indexOf('=');
		let key = equals == -1 ? one : one.substr(0,equals);
		let value = equals == -1 ? '' : one.substr(equals+1);

		if(value === 'true' || value === '') {value = true;}
		else if(value === 'false') {value = false;}
		else if(!isNaN(value)) {value = parseInt(value);}

		out[key] = value;
	});
	return out;
}
function readGames() {
	let lines = fs.readFileSync(gamesFile,'utf8').split('\n');
	let games = {};

	lines.forEach((line) => {
		// strip comments
		let comment = line.indexOf('#');
		if(comment != -1) {line = line.substr(0,comment);}
		line = line.trim();
		if(!line) {return;}

		let split = line.split('|');

		games[split[0].trim()] = {
			pretty: split[1].trim(),
			protocol: split[2].trim(),
			options: parseList(split[3]),
			params: parseList(split[4])
		};
	});
	return games;
}
let games = readGames();

function createProtocolInstance(type) {
	type = Path.basename(type);

	let path = protocolDir+'/'+type;
	if(!fs.existsSync(path+'.js')) {throw Error('Protocol definition file missing: '+type);}
	let protocol = require(path);

	return new protocol();
}

module.exports = {
	lookup: function(type) {
		if(!type) {throw Error('No game specified');}

		if(type.substr(0,9) == 'protocol-') {
			return createProtocolInstance(type.substr(9));
		}

		let game = games[type];
		if(!game) {throw Error('Invalid game: '+type);}

		let query = createProtocolInstance(game.protocol);
		query.pretty = game.pretty;
		for(var key in game.options)
			{query.options[key] = game.options[key];}
		for(var key in game.params)
			{query[key] = game.params[key];}

		return query;
	},
	printReadme: function() {
		let out = '';
		for(let key in games) {
			let game = games[key];
			out += "* "+game.pretty+" ("+key+")";
			if(game.options.port_query_offset || game.options.port_query)
				{out += " [[Separate Query Port](#separate-query-port)]";}
			if(game.params.doc_notes)
				{out += " [[Additional Notes](#"+game.params.doc_notes+")]"}
			out += "\n";
		}
		return out;
	}
};
