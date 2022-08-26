// client side io connection
const socket = io();

// cached elements
const form = document.querySelector('#messageForm');
const input = form.querySelector('#msgInput');
const locBtn = document.querySelector('#send-loc');
const formBtn = document.querySelector('#formBtn');
const messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // new message element to see if user is at the bottom to perform autoscrolling
  const newMessage = messages.lastElementChild;

  // height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  // have to get bottom margin or else autoscroll wouldn't work since message child would never be at the bottom
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // get visible height
  const visibleHeight = messages.offsetHeight;
  // get container height
  const containerHeight = messages.scrollHeight;

  // scroll distance from top and use to calculate how far from bottom viewport is
  const scrollOffset = messages.scrollTop + visibleHeight;

  // if statement to calculate if we were at the container bottom before new message
  // however function is running after new message was sent so must account for new message height

  // scrollIntoView default fixed auto scroll issue on mobile
  // update: it only fixed it when hit go/enter on keyboard. scroll is still offset if you click on the send logo

  if (Window.innerWidth < 480) messages.scrollIntoView(true);
  else {
    containerHeight - newMessageHeight <= scrollOffset;
    messages.scrollTop = messages.scrollHeight;
  }
};

// set variables to be rendered for socket.io message event to server
socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

// set variables to be rendered for socket.io location message event to server
socket.on('locationMessage', (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

// set room users for user lists in sidebar socket.io event
socket.on('roomUsers', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});

// submit button event listener
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // disable form to prevent multi sends
  formBtn.setAttribute('disabled', 'disabled');

  // uses event object and html name attribute to retrieve value of input
  const message = e.target.elements.message.value;
  input.value = '';
  input.focus();

  // 3rd parameter in emit() is for event acknowledgement
  socket.emit('sendMessage', message, (error) => {
    // enable form after message is sent
    formBtn.removeAttribute('disabled');
    if (error) {
      return console.log(error);
    }
  });
});

// location button event listener
locBtn.addEventListener('click', () => {
  if (!navigator.geolocation)
    return alert('Browser does not support geolocation.');

  // disable location button so multiple locations cannot be sent redundantly
  locBtn.setAttribute('disabled', 'disabled');

  // confirm if user wants to share location
  let locationConfirm = confirm('Share Location?');

  // if confirmed emit socket.io send location event to server side
  if (locationConfirm) {
    navigator.geolocation.getCurrentPosition((position) => {
      socket.emit(
        'sendLocation',
        {
          lat: position.coords.latitude,
          long: position.coords.longitude,
        },
        (error) => {
          if (error) return console.log(error);
          locBtn.removeAttribute('disabled');
        }
      );
    });
  }
});

// socket.io join emit to server
socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
