var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};

 Entity = function(param) {
	var self = {
		x:250,
		y:250,
		spdX:0,
		spdY:0,
		id:"",
		map:'forest',
	}
	if(param){
		if(param.x)
			self.x = param.x;
		if(param.y)
			self.y = param.y;
		if(param.map)
			self.map = param.map;
		if(param.id)
			self.id = param.id;
	}
	self.update = function() {
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x +=self.spdX;
		self.y +=self.spdY;
	}
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
	}
	return self;
}
Entity.getFrameUpdateData = function(){
	var pack ={
		initPack:{
			player:initPack.player,
			bullet:initPack.bullet,
		},
		removePack:{
			player:removePack.player,
			bullet:removePack.bullet,
		},
		updatePack:{
			player:Player.update(),
			bullet:Bullet.update(),
		}

	};
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
	return pack;
}
 Player = function(param) {
	var self = Entity(param);
		self.number ="" + Math.floor(10 * Math.random());
		self.username = param.username;
		self.pressingRight=false;
		self.pressingLeft=false;
		self.pressingDiag_left=false;
		self.pressingDiag_left2=false;
		self.pressingUp=false;
		self.pressingDown=false;
		self.pressingAttack=false;
		self.mouseAngle=0;
		self.maxSpd=5;
		self.hp=10;
		self.hpMax=10;
		self.mana=10;
		self.manaMax=10;
		self.score=0;
		self.inventory = new Inventory(param.socket,true);
		self.anim=0;
		self.direction=0;
		self.defi="";
		self.deplacement="";
		self.defi_up=false;

		var super_update = self.update;
		self.update = function(){
			self.anim+=0.25;
			if(self.anim>24){
				self.anim=0;
			}
			self.updateSpd();
			super_update();
			if(self.pressingAttack){
				self.shootBullet(self.mouseAngle);
		}
	}
		self.shootBullet = function(angle){
			if(Math.random()<0.1){
				self.inventory.addItem("potion",1);
			}
			self.pressingAttack=false;
			var b = Bullet({
				parent:self.id,
				angle:angle,
				x:self.x,
				y:self.y,
				map:self.map,
			});
		}

		
	self.updateSpd = function(){
		if(self.pressingRight){
			self.spdX = self.maxSpd;
			self.direction=2;

		}
		else if (self.pressingLeft){
			self.spdX = -self.maxSpd;
			self.direction=1;
		}
		else {
			self.spdX = 0;

		}
		if(self.pressingUp){
			self.spdY = -self.maxSpd;
			self.direction=3;

		}
		else if (self.pressingDown){
			self.spdY = self.maxSpd;
			self.direction=0;
		}
		else {
			self.spdY = 0;

		}
		if((self.pressingUp||self.pressingDown)&&(self.pressingLeft||self.pressingRight)){
			self.spdY=self.spdY/1.5;
			self.spdX=self.spdX/1.5;
		}
		
	}
	self.getInitPack = function(){
		return{
			id:self.id,
			x:self.x,
			y:self.y,
			number:self.number,
			hp:self.hp,
			hpMax:self.hpMax,
			mana:self.mana,
			manaMax:self.manaMax,
			score:self.score,
			map:self.map,
			anim:self.anim,
			direction:self.direction,

			
		};
	}
	self.getUpdatePack = function(){
		if(self.mana<self.manaMax){
			if(self.manaMax-self.mana<0.1){
				self.mana+=self.manaMax-self.mana;
			}
			else{
			self.mana+=0.1;

			}
		}
		return{
			id:self.id,
			x:self.x,
			y:self.y,
			hp:self.hp,
			mana:Math.round(self.mana*100)/100,
			score:self.score,
			map:self.map,
			anim:self.anim,
			direction:self.direction,
			
		};
	}

	Player.list[self.id] = self;
	initPack.player.push(self.getInitPack());

	return self;
}
Player.getList = function(){
	var listid = {}
	for(var i in Player.list){
		 listid[i] = Player.list[i].id;
	}
	return listid;
}
Player.list={};

Player.onConnect = function(socket,username) {
	var map = 'forest';
	var player = Player({
		username:username,
		id:socket.id,
		map:map,
		socket:socket,
	});  //créer le joueur avec un id
	//Si il y a une réponse du client
	socket.on('keyPress',function(data){
		if(data.inputId ==='left' && player.pressingLeft != data.state){
			player.pressingLeft = data.state;
		}
		if(data.inputId ==='right' && player.pressingRight != data.state){
			player.pressingRight = data.state;
		}
		if(data.inputId ==='up' && player.pressingUp != data.state){
			player.pressingUp = data.state;
		}
		if(data.inputId ==='down' && player.pressingDown != data.state){
			player.pressingDown = data.state;
		}
		if(data.inputId ==='attack' && player.defi_up &&player.mana>=3.5){
			player.pressingAttack = data.state;
			if(player.pressingAttack){
				player.mouseAngle = data.angle;
				player.mana-=3.5;		
			}			
		}
		if(data.inputId === 'mouseAngle'){
			if(!player.pressingDown && !player.pressingUp && !player.pressingRight && !player.pressingLeft){
			player.direction=data.state;
		}
		}
	});
	socket.on('changeMap',function(){
		if(player.map === 'field')
			player.map = 'forest';
		else
			player.map = 'field';

	});
	socket.on('sendMsgToServer', function(data){
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addTochat', player.username +': '+ data);
		}
	});
	socket.on('sendPmToServer', function(data){
		var recipientSocket = null;
		if(player.username === data.username){
			socket.emit('addTochat','Vous ne pouvez pas vous envoyez de message');
			return;
		}
		for(var i in Player.list)
			if(Player.list[i].username === data.username){
				recipientSocket = SOCKET_LIST[i];
				break;
			}
		if(recipientSocket == null){
			socket.emit('addTochat','Le joueur ' + data.username + ' est hors connexion');
		}else{
			recipientSocket.emit('addTochat','Message privé de '+player.username +': '+data.message);
			socket.emit('addTochat','Message privé pour '+data.username +': '+data.message);
		}
	});
	socket.on('sendDefi',function(data){
		var recipientSocket = null;
		if(player.username === data.username){
			socket.emit('addTochat','Vous ne pouvez pas vous défiez');
			return;
		}
		for(var i in Player.list)
			if(Player.list[i].username === data.username){
				recipientSocket = SOCKET_LIST[i];
				break;
			}
		if(recipientSocket == null ){
			socket.emit('addTochat','Le joueur ' + data.username + ' est hors connexion');
		}else if(Player.list[i].defi != "" ){
			socket.emit('addTochat','Le joueur ' + data.username + ' est en attente de défi');
		}else if(Player.list[i].defi_up){
			socket.emit('addTochat','Le joueur ' + data.username + ' est en défi ');
		}
		else{
			player.defi=i;
			Player.list[i].defi=player.id;
			recipientSocket.emit('addTochat','Le joueur '+player.username +' vous defi');
			recipientSocket.emit('defi',player.username);
			socket.emit('addTochat','En attente de la réponse de  '+data.username );
		}
	});
	socket.on('valide',function(data){
		var recipientSocket = null;
		for(var i in Player.list)
			if(Player.list[i].username === data)
				recipientSocket = SOCKET_LIST[i];
		if(recipientSocket == null){
			socket.emit('addTochat','Le joueur ' + data + ' est hors connexion');
		}else{
			player.defi_up=true;
			Player.list[i].defi_up=true;
			recipientSocket.emit('addTochat','Le joueur '+player.username +' accepte votre defi');
			recipientSocket.emit('map');
			socket.emit('map');
	}
	});
	socket.on('non_valide',function(data){
		var recipientSocket = null;
		for(var i in Player.list)
			if(Player.list[i].username === data)
				recipientSocket = SOCKET_LIST[i];
		if(recipientSocket == null){
			socket.emit('addTochat','Le joueur ' + data + ' est hors connexion');
		}else{
			player.defi="";
			Player.list[i].defi="";
			recipientSocket.emit('addTochat','Le joueur '+ player.username +' a refuse votre defi');
			socket.emit('addTochat','Vous avez refuse le defi de '+ data);
	}
	});

	socket.emit('init' ,{
		selfId:socket.id,
		player:Player.getAllInitPack(),
		bullet:Bullet.getAllInitPack(),
	})
}

Player.getAllInitPack = function() {
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	return players;
}
Player.onDisConnect = function(socket){
	console.log(Player.list[socket.id]);
	if(Player.list[socket.id].defi!=""){
		var m;
		console.log(m);
		for(var i in Player.list){
			if(Player.list[socket.id].defi_up){
			if(Player.list[socket.id].defi==Player.list[i].id){
				msg=SOCKET_LIST[i];
				if(Player.list[socket.id].defi_up){
					m=Player.list[socket.id].defi;
					Player.list[m].defi="";
					Player.list[m].defi_up=false;
					Player.list[m].map="forest";
					msg.emit('addTochat','Le joueur '+Player.list[socket.id].username+ ' a quitté le défi');
			    }
				else {
					m=Player.list[socket.id].defi;
					Player.list[m].defi="";
					msg.emit('Stop');
					msg.emit('addTochat','Le joueur '+Player.list[socket.id].username+ ' a annulé le défi');
					}
				}
			}
		}
	}
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}
Player.update = function(socket){
	var pack = [];
	for(var i in Player.list) {
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());
	}
	return pack;
}
 Bullet = function(param) {
	var self = Entity(param);
	self.id = Math.random();
	self.angle = param.angle;
	self.spdX = Math.cos(param.angle/180*Math.PI)*10;
	self.spdY = Math.sin(param.angle/180*Math.PI)*10;
	self.parent = param.parent;
	self.timer=0;
	self.toRemove=false;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();
		for (var i in Player.list){
			var p = Player.list[i];
			if(self.map === p.map && self.getDistance(p)<32 && self.parent !== p.id){
				p.hp -=1;
				if(p.hp <=0){
					var shooter = Player.list[self.parent];
					if(shooter)
						shooter.score+=1;
					p.hp = p.hpMax;
					p.x = Math.random()*500;
					p.y = Math.random()*500;
					//gagnant=SOCKET_LIST[shooter.defi];
					//perdant=SOCKET_LIST[p.defi];
					p.defi="";
					shooter.defi="";
					p.defi_up=false;
					shooter.defi_up=false;
					p.map='forest';
					shooter.map='forest';
					//gagnant.emit('addTochat', 'Vous avez gagné le défi contre ' + p.username);
					//perdant.emit('addTochat', 'Vous avez perdu le défi contre ' + shooter.username);
				}
				self.toRemove = true;
			}
		}
	}
	self.getInitPack = function(){
		return{
			id:self.id,
			x:self.x,
			y:self.y,
			map:self.map,
		};
	}
	self.getUpdatePack = function(){
		return{
			id:self.id,
			x:self.x,
			y:self.y,
		};
	}
	Bullet.list[self.id]=self;
	initPack.bullet.push(self.getInitPack());
	return self;
}
Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list) {
		var bullet  = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else
			pack.push(bullet.getUpdatePack());
	}
	return pack;
}
Bullet.list ={};
Bullet.getAllInitPack = function() {
	var bullets = [];
	for(var i in Bullet.list)
		bullets.push(Bullet.list[i].getInitPack());
	return bullets;
}