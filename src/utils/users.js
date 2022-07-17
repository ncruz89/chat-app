const users = [];

// add user
const addUser = ({ id, username, room }) => {
  // Clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // validate data
  if (!username || !room) {
    return {
      error: 'Username and room are required',
    };
  }

  // Check for duplicate name
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  // validate username
  if (existingUser)
    return {
      error: 'Username is taken',
    };

  // store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

// remove user
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

// get user by id
const getUser = (id) => {
  return users.find((user) => user.id === id);
};

// get users in room
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
