var express=require('express');

var app=express();

var server=require('http').createServer(app);

var io=require('socket.io').listen(server);

var users=[];
var connections=[];
// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];
// usernames which are currently connected to the chat
var usernames = {};

server.listen(process.env.PORT || 5000);

console.log("...SERVER RUNNING...");


app.get("/",(req,res)=>{
    res.sendFile(__dirname+'/index.html');
});

io.sockets.on("connection",(socket)=>{

    
    connections.push(socket);
   // console.log("Live Connections: %s",connections.length);
    
    socket.on('send message',(data,x)=>{
        console.log(data);
        socket.to(socket.msg).emit('New Message',{msg:data,x});
        socket.emit('ownmassage',{msg:data,x:socket.username,y:socket.msg});
      
    });

   

    socket.on('New User',function (data,callback) {
        callback(true);
     //   roomName=data.name;
        socket.username=data.name;
        socket.room=data.name;
        socket.join(socket.room);
        users.push(socket.username);
     //  console.log(socket.room);
        socket.emit('joinmassage',{msg:socket.room+", You're conneted..."});
            
        updateUsernames();
    });

    
    function updateUsernames()
    {
        console.log(users);
        io.sockets.emit('Get Users', {temp:JSON.stringify(users)});
    }

    socket.on('joinroom',function(data){

        socket.msg=data.val;
        
    });
    




    socket.on('adduser', function(user){
        console.log("====================>>>>>>>>>"+user);
		// store the user in the socket session for this client
		socket.user = user;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's user to the global list
		users[user] = user;
		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', user + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.user, data);
	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.user+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.user+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});

    socket.on('disconnect',(data)=>{
        if(!socket.username) return;
        users.splice(users.indexOf(socket),1);
        connections.splice(connections.indexOf(socket),1);
      //  console.log("Live Connections: %s",connections.length);
    });
    
});