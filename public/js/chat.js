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
  console.log(window.innerWidth);
  if (Window.innerWidth < 480) messages.scrollTop = messages.scrollHeight;
  else {
    containerHeight - newMessageHeight <= scrollOffset;
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomUsers', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});
// const cntBtn = document.querySelector('#cntBtn');
// cntBtn.addEventListener('click', () => {
//   console.log('clicked!');
//   socket.emit('btnClicked');
// });

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

locBtn.addEventListener('click', () => {
  if (!navigator.geolocation)
    return alert('Browser does not support geolocation.');

  locBtn.setAttribute('disabled', 'disabled');

  let locationConfirm = confirm('Share Location?');

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

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
