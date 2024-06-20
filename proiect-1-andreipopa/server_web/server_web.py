import socket
import os
import gzip
import threading 
import json

def handle_client(clientsocket):
    print('S-a conectat un client.')
    cerere = ''
    linieDeStart = ''
    while True:
        buf = clientsocket.recv(1024)
        if len(buf) < 1:
            break
        cerere += buf.decode()
        print('S-a citit mesajul: \n---------------------------\n' + cerere + '\n---------------------------')
        pozitie = cerere.find('\r\n')
        if (pozitie > -1 and linieDeStart == ''):
            linieDeStart = cerere[0:pozitie]
            print('S-a citit linia de start din cerere: ##### ' + linieDeStart + ' #####')
            break
    print('S-a terminat cititrea.')
    if linieDeStart == '':
        clientsocket.close()
        print('S-a terminat comunicarea cu clientul - nu s-a primit niciun mesaj.')
        return

    elementeLineDeStart = linieDeStart.split()

    if elementeLineDeStart[0] == "POST" and elementeLineDeStart[1] == "/api/utilizatori":
        startIndex = cerere.find('{')
        stopIndex = cerere.find('}') + 1
        word =""
        for i in range(startIndex, stopIndex):
            word += cerere[i]
        print(word)

        payload = json.loads(word)
        f = open("./continut/resurse/utilizatori.json", 'r')
        input = f.read()
        f.close()

        input = input.replace("]", ",") + word + "]"
        print(input)

        f = open("./continut/resurse/utilizatori.json", 'w')
        f.write(input)

        clientsocket.sendall('HTTP/1.1 200 OK\r\n'.encode("UTF-8"))


    numeResursaCeruta = elementeLineDeStart[1]
    if numeResursaCeruta == '/':
        numeResursaCeruta = '/index.html'

    numeFisier = './continut' + numeResursaCeruta

    fisier = None
    try:
        fisier = open(numeFisier, 'rb')
        numeExtensie = numeFisier[numeFisier.rfind('.')+1:]
        tipuriMedia = {
            'html': 'text/html; charset=utf-8',
            'css': 'text/css; charset=utf-',
            'js': 'text/javascript; charset=utf-8',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif', 
            'ico': 'image/x-icon',
            'xml': 'application/xml; charset=utf-8',
            'json': 'application/json; charset=utf-8'
        }
        tipMedia = tipuriMedia.get(numeExtensie, 'text/plain; charset=utf-8')

        content = fisier.read()

        content_compressed = gzip.compress(content)

        clientsocket.sendall(b'HTTP/1.1 200 OK\r\n');
        clientsocket.sendall(('Content-Length: ' + str(len(content_compressed)) + '\r\n').encode());
        clientsocket.sendall(('Content-Type: ' + tipMedia +'\r\n').encode());
        clientsocket.sendall(b'Content-Encoding: gzip\r\n');
        clientsocket.sendall(b'Server: My PW Server\r\n');
        clientsocket.sendall(b'\r\n');

        clientsocket.sendall(content_compressed)

    except IOError:
        msg = 'Eroare! Resursa ceruta ' + numeResursaCeruta + ' nu a putut fi gasita!'
        print(msg)
        clientsocket.sendall(b'HTTP/1.1 404 Not Found\r\n');
        clientsocket.sendall(('Content-Length: ' + str(len(msg.encode('utf-8'))) + '\r\n').encode());
        clientsocket.sendall(b'Content-Type: text/plain; charset=utf-8\r\n');
        clientsocket.sendall(b'Server: My PW Server\r\n');
        clientsocket.sendall(b'\r\n');
        clientsocket.sendall(msg.encode())

    finally:
        if fisier is not None:
            fisier.close()
        clientsocket.close()
        print('S-a terminat comunicarea cu clientul.')

# Creează un server socket
serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serversocket.bind(('', 5678))
serversocket.listen(5)

print('#########################################################################')
print('Serverul asculta potentiali clienti.')

while True:
    # Așteaptă conectarea unui client la server
    (clientsocket, address) = serversocket.accept()
    # Procesează clientul într-un fir de execuție nou
    threading.Thread(target=handle_client, args=(clientsocket,)).start()
