require('dotenv').config();

const getPorts = () => {
  return Object.keys(localStorage).map((key) =>
    JSON.parse(localStorage.getItem(key))
  );
};

const config = {
  PORT: getPorts()[0]
    ? getPorts()[0]
    : process.env.PORT
    ? process.env.PORT
    : 8008,
};

module.exports = { config };
