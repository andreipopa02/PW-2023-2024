self.addEventListener('message', function(event) {
    console.log('Worker: Am primit notificare de la scriptul principal.');
    self.postMessage('Notificare de la worker.');
});