/* -----Laboratorul 6----- */
/*Sectiunea 1*/
function data() {
    document.getElementById("data").innerHTML = new Date().toLocaleString();
    setInterval(data, 1000);
}

function url(){
    document.getElementById("url").innerHTML = window.location.href;
}

function browser_name_version(){
    document.getElementById("browser").innerHTML = navigator.appCodeName + " " + navigator.appVersion;
}

function locatie() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById("locatie").innerHTML = "Geolocația nu este suportată de acest browser.";
    }
}

function locatie() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(coordonate);
    } else {
        document.getElementById("locatie").innerHTML = "Geolocația nu este suportată de acest browser.";
    }
}

function coordonate(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    document.getElementById("locatie").innerHTML = "Latitudine: " + latitude + "<br>Longitudine: " + longitude;
}

function sistem_de_operare() {
    var os = "Nu se cunoaste sistemul de operare!";
    if (navigator.appVersion.indexOf("Win") != -1) os = "Windows";
    if (navigator.appVersion.indexOf("Mac") != -1) os = "MacOS";
    if (navigator.appVersion.indexOf("Linux") != -1) os = "Linux";
    document.getElementById("sistem_de_operare").innerHTML = os;
}


/*Sectiunea 2*/
var rectangles = [];

function desenare() {   
    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");
    var isDrawing = false;
    var strokeColor = document.getElementById("borderColor").value;
    var fillColor = document.getElementById("backColor").value;
    var startX, startY, endX, endY;
    
    canvas.addEventListener("mousedown", function (event) {
        isDrawing = true;
        startX = event.offsetX;
        startY = event.offsetY;
        rectangles.push({ startX: startX, startY: startY, width: 0, height: 0, 
            strokeColor: strokeColor, fillColor: fillColor });
    });

    canvas.addEventListener("mousemove", function (event) {
        if (isDrawing) {
            var currentRect = rectangles[rectangles.length-1];
            currentRect.width = event.offsetX - currentRect.startX;
            currentRect.height = event.offsetY - currentRect.startY;
            redrawCanvas();
        }
    });

    canvas.addEventListener("mouseup", function () {
        isDrawing = false;
        var currentRect = rectangles[rectangles.length - 1];
        endX = event.offsetX; 
        endY = event.offsetY;
        currentRect.width = endX - startX;
        currentRect.height = endY - startY;
    });

    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < rectangles.length; i++) {
        var rect = rectangles[i];
        context.fillStyle = rect.fillColor;
        context.strokeStyle = rect.strokeColor;
        context.fillRect(rect.startX, rect.startY, rect.width, rect.height);
        context.strokeRect(rect.startX, rect.startY, rect.width, rect.height);
    }

    // Actualizez culorile la schimbarea color picker-ului
    document.getElementById("borderColor").addEventListener("input", function () {
        strokeColor = this.value;
    });

    document.getElementById("backColor").addEventListener("input", function () {
        fillColor = this.value;
    });
   
}

function stergeCanvas() {
    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    rectangles = [];
}


/*Sectiunea 3*/
function adaugaColoana() {
    var table = document.getElementById("tabel");
    var coloana = document.getElementById("pozitie").value;

    if (coloana === "") {
      alert("Introduceți o poziție validă pentru coloană!");
      return;
    }

    var index = parseInt(coloana);
    if (isNaN(index) || index < 1 || index > table.rows.length + 1) {
      alert("Poziția coloanei trebuie să fie un număr întreg pozitiv mai mic sau egal cu numărul de coloane existente plus 1!");
      return;
    }

    for (var i = 0; i < table.rows.length; i++) {
      var cell = table.rows[i].insertCell(index - 1);
      cell.style.backgroundColor = document.getElementById("tableColor").value;
    }
}

function adaugaRand() {
    var table = document.getElementById("tabel");
    var rand = document.getElementById("pozitie").value;

    if (rand === "") {
        alert("Introduceți o poziție validă pentru rând!");
        return;
    }

    var index = parseInt(rand);
    if (isNaN(index) || index < 1 || index > table.rows.length + 1) {
        alert("Poziția rândului trebuie să fie un număr întreg pozitiv mai mic sau egal cu numărul de rânduri existente plus 1!");
        return;
    }

    var newRow = table.insertRow(index - 1);
    for (var i = 0; i < table.rows[0].cells.length; i++) {
        var cell = newRow.insertCell(i);
        cell.style.backgroundColor = document.getElementById("tableColor").value;
    }
}



/* -----Laboratorul 7----- */
function schimbaContinut(resursa, jsFisier, jsFunctie) {
    var xhttp;
    if (resursa == "") {
        document.getElementById("continut").innerHTML = "";
        return;
    }
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("continut").innerHTML = this.responseText;
            if (jsFisier) {
                var elementScript = document.createElement('script');
                elementScript.onload = function () {
                        console.log("hello");
                        if (jsFunctie) {
                            window[jsFunctie]();
                        }};
                elementScript.src = jsFisier; 
                document.head.appendChild(elementScript);
            } 
            else { 
                if (jsFunctie) {
                    window[jsFunctie]();
                } 
            } 
        }
    };
    xhttp.open("GET", resursa + ".html", true); 
    xhttp.send();
}

function inregistreaza() {
    var utilizator = document.getElementById("numeUtilizator").value;
    var parola = document.getElementById("parolaUtilizator").value;
    var jsonString;
    var xhttp = new XMLHttpRequest();
  
    var obj = new Object();
    obj.utilizator = utilizator;
    obj.parola = parola;
    jsonString = JSON.stringify(obj);
  
    xhttp.open("POST", "/api/utilizatori", true);
    xhttp.send(jsonString);
    alert("Felicitari! V-ați înregistrat!")
}

function verificaCampuri() {
    var numeUtilizator = document.getElementById("numeUtilizator").value;
    var parolaUtilizator = document.getElementById("parolaUtilizator").value;

    var butonInregistrare = document.getElementById("butonInregistrare");

    if (numeUtilizator.trim() !== "" && parolaUtilizator.trim() !== "") {
        butonInregistrare.disabled = false;
    } else {
        butonInregistrare.disabled = true;
    }
}
  
function verifica() {
    var utilizatorInput = document.getElementById("utilizator").value;
    var parolaInput = document.getElementById("parola").value;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                var utilizatori = JSON.parse(xhr.responseText);
                var gasit = false;
                for (var i = 0; i < utilizatori.length; i++) {
                    if (utilizatori[i].utilizator === utilizatorInput && utilizatori[i].parola === parolaInput) {
                        gasit = true;
                        break;
                    }
                }
                if (gasit) {
                    document.getElementById("statusVerificat").innerText = "Utilizator și parolă corecte!";
                } else {
                    document.getElementById("statusVerificat").innerText = "Utilizator sau parolă incorectă!";
                }
            } else {
                console.error('Eroare la solicitarea fișierului utilizatori.json');
            }
        }
    };
    xhr.open("GET", "resurse/utilizatori.json", true);
    xhr.send();
}

