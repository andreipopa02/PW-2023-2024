
//  Tema 1

var id = 1;
class Produs {
    constructor(id, numeProdus, cantitate) {
        this.id = id;
        this.numeProdus = numeProdus;
        this.cantitate = cantitate;
    }
}

function adaugaProdus() {
    var numeProdus = document.getElementById('numeProdus').value;
    var cantitate = document.getElementById('cantitate').value;

    if (numeProdus.trim() === '' || cantitate.trim() === '') {
        return;
    }

    let produs = new Produs(id++, numeProdus, parseInt(cantitate));
    
    var listaCumparaturi = JSON.parse(localStorage.getItem('cumparaturi')) || [];
    listaCumparaturi.push(produs);
    localStorage.setItem('cumparaturi', JSON.stringify(listaCumparaturi));

    adaugaProdusInTabel(produs);

    document.getElementById('numeProdus').value = '';
    document.getElementById('cantitate').value = '';
};

// Tema 2

const worker = new Worker('js/worker.js');

worker.addEventListener('message', function(event) {
    console.log('Scriptul principal: ' + event.data);
    adaugaLinieTabel(event.data);
});

function adaugaProdusInTabel(produs) {
    var tabel = document.getElementById('tabelCumparaturi');
    var rand = tabel.insertRow();
    rand.innerHTML = `
        <td>${produs.id}</td>
        <td>${produs.numeProdus}</td>
        <td>${produs.cantitate}</td>`;
}