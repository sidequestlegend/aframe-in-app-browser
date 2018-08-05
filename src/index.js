window.io = require('socket.io-client');
module.exports = {
    browser:require('./components/browser'),
    addressBar:require('./components/address-bar'),
    curvedPlane:require('./components/curved-plane'),
    mouseShim:require('./components/mouse-shim'),
    doubleClick:require('./components/double-click'),
};