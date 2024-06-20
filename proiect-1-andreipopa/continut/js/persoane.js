function incarcaPersoane() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      createTable(this);
    }
  };
  xmlhttp.open("GET", "resurse/persoane.xml", true);
  xmlhttp.send();
}

function createTable(xml) {
  var i;
  var xmlDoc = xml.responseXML;
  var table="<table><tr><th>Nume</th><th>Prenume</th><th>Vârstă</th><th>Adresă</th><th>Telefon</th><th>Email</th></tr>";
  var x = xmlDoc.getElementsByTagName("persoana");
  
  for (i = 0; i < x.length; i++) { 
    var adresa = x[i].getElementsByTagName("adresa")[0];
    table += "<tr><td>" + 
            x[i].getElementsByTagName("nume")[0].childNodes[0].nodeValue + "</td><td>" + 
            x[i].getElementsByTagName("prenume")[0].childNodes[0].nodeValue + "</td><td>" + 
            x[i].getElementsByTagName("varsta")[0].childNodes[0].nodeValue + "</td><td>" + 
            adresa.getElementsByTagName("strada")[0].childNodes[0].nodeValue + ", nr. " + 
            adresa.getElementsByTagName("numar")[0].childNodes[0].nodeValue + ", " + 
            adresa.getElementsByTagName("localitate")[0].childNodes[0].nodeValue + ", " + 
            adresa.getElementsByTagName("judet")[0].childNodes[0].nodeValue + ", " + 
            adresa.getElementsByTagName("tara")[0].childNodes[0].nodeValue + "</td><td>" + 
            x[i].getElementsByTagName("telefon")[0].childNodes[0].nodeValue + "</td><td>" + 
            x[i].getElementsByTagName("email")[0].childNodes[0].nodeValue + "</td></tr>";
  }
  table += "</table>"
  document.getElementById("tabel").innerHTML = table;
  document.getElementById("paragraf").innerHTML = "";
}

