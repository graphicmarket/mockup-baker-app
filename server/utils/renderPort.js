const { config } = require('../config');
const newPortForm = document.querySelector('.new-port-form');
const inputPort = document.querySelector('.spectrum-input');

newPortForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const port = inputPort.value;
  storePort(port);
  renderPort();
});

const storePort = (port) => {
  localStorage.clear();
  localStorage.setItem(port, port);
};

const renderPort = () => {
  inputPort.value = config.PORT;
};

renderPort();
