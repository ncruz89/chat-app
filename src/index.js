const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();
// server side socketio setup
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// initial socket.io connection
io.on('connection', (socket) => {
  console.log('New Websocket connection');

  // listener for join
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    // emit message to users in a particular room
    socket.emit('message', generateMessage('Admin', 'Welcome!'));
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} has joined!`)
      );
    //emit room users to all users of particular room
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    // callback() to end socket.on('join') event
    callback();
  });

  // socket.io send message event
  // add on a second parameter to the function in .on() for event acknowledgements server side
  socket.on('sendMessage', (message, callback) => {
    // profanity filter enabled
    const filter = new Filter();
    if (filter.isProfane(message)) return callback('Profanity prohibited!');
    // since the server sends the acknowledgement back to the client you can send data as well by adding data as a paramter to callback()
    // acknowledgements can be useful for message filtering amongst many other things

    // get user
    const user = getUser(socket.id);

    // emit message to users of user.room
    io.to(user.room).emit('message', generateMessage(user.username, message));
    // run callback() to end socket.on('sendMessage') event
    callback();
  });

  // socket.io send location event
  socket.on('sendLocation', (loc, callback) => {
    // get user who sent event
    const user = getUser(socket.id);

    // send to users of user.room location of user
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${loc.lat},${loc.long}`
      )
    );
    // run callback() to end socket.on('sendLocation') event
    callback();
  });

  //socket.io user disconnect event
  socket.on('disconnect', () => {
    // if removeUser from users array was successful then emit message to remaining users in user.room that disconnected user has left
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin ', `${user.username} has left.`)
      );
      // update room users list in sidebar
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log('Server is up on port ' + port);
});
