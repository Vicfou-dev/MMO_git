var mongojs=require("mongojs");
var db = mongojs('localhost:27017/myGame', ['account','progress']);

require('./classe');
require('./client/Inventory');

var express = require('express');
var app = express();
var serv = require('http').Server(app);
var profiler = require('v8-profiler');
var fs = require('fs');

app.get('/',function(req,res){
	res.sendFile(__dirname + '/client/index.html')
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server ready");
SOCKET_LIST = {};

//connexion d'un client
var DEBUG =true;

var USERS = {
	"bob":"asd",
	"bob2":"bob",
	"bob3":"ttt",
}
var isValidPassword = function(data,cb){
	db.account.find({username:data.username,password:data.password},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});
	

}
var isUsernameTaken = function(data,cb){
	db.account.find({username:data.username},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});
}
var addUser = function(data,cb){
	db.account.insert({username:data.username,password:data.password},function(err,res){
		cb();
	});
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id]=socket;

	socket.on('signIn',function(data){
		isValidPassword(data,function(res) {
			if(res){
				Player.onConnect(socket,data.username);
				socket.emit('signInResponse',{success:true});
		}else {
				socket.emit('signInResponse',{success:false});
		}
	});

	});
	socket.on('signUp',function(data){
		isUsernameTaken(data,function(res) {
			if(res){
				socket.emit('signUpResponse',{success:false});
		} else{
			addUser(data,function(){
				socket.emit('signUpResponse',{success:true});
			});
		}	
	});

	});
	//créer un joueur en fonction du socket
	//Appelle la fonction pour deco le joueur
	socket.on('disconnect',function(){

		delete SOCKET_LIST[socket.id];
		var connecter = Player.getList();
		if(connecter[socket.id]==[socket.id]){
			Player.onDisConnect(socket);
		}
	});
	
	socket.on('evalServer',function(data){
		if(!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer', res);
	});
	
});

setInterval(function(){
	var packs = Entity.getFrameUpdateData();
	//Update la position de tous les joueur toutes les 40ms
	for(var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('init', packs.initPack);
		socket.emit('update', packs.updatePack);
		socket.emit('remove', packs.removePack);

	}

},40);

var startProfiling = function(duration){
	profiler.startProfiling('1',true);
	setTimeout(function(){
		var profile1 = profiler.stopProfiling('1');
		profile1.export(function(error,result){
			fs.writeFile('./profile.cpuprofile',result);
			profile1.delete();
		});
	},duration);
}
