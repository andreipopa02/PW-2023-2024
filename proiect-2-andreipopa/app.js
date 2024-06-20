const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');
const app = express();
const port = 6789;
const sqlite3 = require('sqlite3').verbose();

const failedLoginAttempts = {};
const MAX_ATTEMPTS_SHORT = 5;
const MAX_ATTEMPTS_LONG = 10;
const BLOCK_TIME_SHORT = 1 * 60 * 1000; // 1 minut
const BLOCK_TIME_LONG = 60 * 60 * 1000; // 1 oră


app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'secretKey', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));


// ---Rute---

// --- Laborator 10 ---
app.get('/', (req, res) => {
    const blockEndTime = req.cookies.blockEndTime;
    const currentTime = Date.now();

    if (blockEndTime && blockEndTime > currentTime) {
        return res.status(403).send(`Acces temporar blocat pentru încercări eșuate repetate. Vă rugăm să încercați din nou mai târziu.`);
    }

    const utilizator = req.session.utilizator;
    let produseBD = [];

    let db = new sqlite3.Database('./cumparaturi.db', (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Conexiune cu baza de date esuata! - "/"');
        }
        //console.log('Conectat la baza de date! - "/"');

        db.all(`SELECT * FROM produse`, [], (err, rows) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Eroare la afisarea produselor! - "/"');
            }
            produseBD = rows;
            res.render('index', { utilizator: utilizator, produse: produseBD });
        });

        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            //console.log('Conexiune cu baza de date inchisa!- "/"');
        });
    });
});

app.get('/chestionar', (req, res) => {
    const blockEndTime = req.cookies.blockEndTime;
    const currentTime = Date.now();

    if (blockEndTime && blockEndTime > currentTime) {
        return res.status(403).send(`Acces temporar blocat pentru încercări eșuate repetate. Vă rugăm să încercați din nou mai târziu.`);
    }

    fs.readFile('intrebari.json', (err, data) => {
        if (err) {
            console.error(err.message);
        }
        const listaIntrebari = JSON.parse(data);
        const utilizator = req.session.utilizator;
        res.render('chestionar', { intrebari: listaIntrebari, utilizator: utilizator });
   
    });
});

app.post('/rezultat-chestionar', (req, res) => {
    fs.readFile('intrebari.json', (err, data) => {
        if (err) {
            console.error(err.message);
        }
        const listaIntrebari = JSON.parse(data);
        const raspunsuriPrimite = req.body;
        let numarRaspunsuriCorecte = 0;

        listaIntrebari.forEach((intrebare, index) => {
            const raspunsCorect = intrebare.corect;
            const raspunsDat = parseInt(raspunsuriPrimite[`intrebare${index}`]);

            if (raspunsDat === raspunsCorect) {
                numarRaspunsuriCorecte++;
            }
        });

        res.render('rezultat-chestionar', {
            listaIntrebari,
            numarRaspunsuriCorecte,
            raspunsuriPrimite
        });
    });
});



// --- Laborator 11 ---
function checkAuthenticated(req, res, next) {
    if (req.session.utilizator) {
        return res.redirect('/'); 
    }
    next(); 
}

app.get('/autentificare', checkAuthenticated, (req, res) => {
    const blockEndTime = req.cookies.blockEndTime;
    const currentTime = Date.now();

    if (blockEndTime && blockEndTime > currentTime) {
        return res.status(403).send(`Acces temporar blocat pentru încercări eșuate repetate. Vă rugăm să încercați din nou mai târziu.`);
    }

    const mesajEroare = req.session.mesajEroare;
    delete req.session.mesajEroare;
    res.render('autentificare', { mesajEroare: mesajEroare });
});


app.post('/verificare-autentificare', (req, res) => {
    const { utilizator, parola } = req.body;
    const ip = req.ip;
    const currentTime = Date.now();

    fs.readFile('utilizatori.json', (err, data) => {
        if (err) {
            console.error('Eroare la citirea fisierului:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        const utilizatori = JSON.parse(data);
        const user = utilizatori.find(u => u.utilizator === utilizator && u.parola === parola);

        if (user) {
            // resetare contor
            failedLoginAttempts[ip] = { attempts: 0, lastAttemptTime: 0, blockEndTime: 0 };
            req.session.utilizator = {
                utilizator: user.utilizator,
                nume: user.nume,
                prenume: user.prenume,
                rol: user.rol
            };
            res.cookie('utilizator', user.utilizator, { maxAge: 15*60*1000, httpOnly: true });
            res.redirect('/');
        } else {
            // Gestionare incercari esuate
            if (!failedLoginAttempts[ip]) {
                failedLoginAttempts[ip] = { attempts: 0, lastAttemptTime: 0, blockEndTime: 0 };
            }
            failedLoginAttempts[ip].attempts++;
            failedLoginAttempts[ip].lastAttemptTime = currentTime;

            console.log(`Număr de încercări eșuate pentru IP-ul ${ip}: ${failedLoginAttempts[ip].attempts}`);

            if (failedLoginAttempts[ip].attempts == MAX_ATTEMPTS_SHORT) {
                failedLoginAttempts[ip].blockEndTime = currentTime + BLOCK_TIME_SHORT;
                const blockEndTime = Date.now() + BLOCK_TIME_SHORT;
                res.cookie('blockEndTime', blockEndTime, { maxAge: BLOCK_TIME_SHORT, httpOnly: true });
            }
            if (failedLoginAttempts[ip].attempts == MAX_ATTEMPTS_LONG) {
                failedLoginAttempts[ip].blockEndTime = currentTime + BLOCK_TIME_LONG;
                const blockEndTime = Date.now() + BLOCK_TIME_LONG;
                res.cookie('blockEndTime', blockEndTime, { maxAge: BLOCK_TIME_LONG, httpOnly: true });
            }
            if (failedLoginAttempts[ip].attempts > MAX_ATTEMPTS_LONG) {
                failedLoginAttempts[ip].blockEndTime = currentTime + BLOCK_TIME_LONG;
                const blockEndTime = Date.now() + BLOCK_TIME_LONG;
                res.cookie('blockEndTime', blockEndTime, { maxAge: 24 * BLOCK_TIME_LONG, httpOnly: true });
            }

            req.session.mesajEroare = 'Utilizator sau parolă incorectă!';
            res.redirect('/autentificare');
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.clearCookie('utilizator');
        res.redirect('/');
    });
});


// --- Laborator 12 ---
app.get('/creare-bd', (req, res) => {
    const createScript = fs.readFileSync(__dirname + '/creare-bd.sql', 'utf8');
    let db = new sqlite3.Database('./cumparaturi.db', (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Conexiune cu baza de date esuata! - "/creare-db"');
        }
        //console.log('Conectat la baza de date! - "/creare-db"');

        db.exec(createScript, function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Eroare la crearea tabelei! - "/creare-db"');
            }
           // console.log('Tabela creata cu succes! - "/creare-db"');
            res.redirect('/');
        });

        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            //console.log('Conexiune cu baza de date inchisa! - "/creare-db"');
        });
    });
});

app.get('/inserare-bd', (req, res) => {
    const insertScript = fs.readFileSync(__dirname + '/inserareProduse.sql', 'utf8');
    let db = new sqlite3.Database('./cumparaturi.db', (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Conexiune cu baza de date esuata! - "/inserare-bd"');
        }
        //console.log('Conectat la baza de date! - "/inserare-bd"');

        const query = `SELECT COUNT(*) as count FROM produse`;

        db.get(query, (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Eroare la verificarea produselor existente! - "/inserare-bd"');
            }

            if (row.count > 0) {
                console.log('Produsele sunt deja inserate! - "/inserare-bd"');
                return res.redirect('/');
            }

            db.exec(insertScript, function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Eroare la inserarea produselor! - "/inserare-bd"');
                }
                //console.log('Produsele au fost inserate cu succes! - "/inserare-bd"');
                req.session.produsInserat = true;
                res.redirect('/');
            });

            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
                //console.log('Conexiune cu baza de date inchisa! - "/inserare-bd"');
            });
        });
    });
});

app.post('/adaugare-cos', (req, res) => {
    const { id } = req.body;

    if (!req.session.utilizator) {
        return res.status(401).send('Utilizatorul nu este autentificat.');
    }

    if (!req.session.cos) {
        req.session.cos = [];
    }

    // caut produsul in cos
    const produsInCos = req.session.cos.find(produs => produs.id === parseInt(id));

    if (produsInCos) {
        produsInCos.cantitate += 1; // actualizez cantitatea
    } else {
        req.session.cos.push({ id: parseInt(id), cantitate: 1 }); // adaug produsul cu cantitatea 1
    }

    res.redirect('/');
});

app.get('/vizualizare-cos', (req, res) => {
    const blockEndTime = req.cookies.blockEndTime;
    const currentTime = Date.now();

    if (blockEndTime && blockEndTime > currentTime) {
        return res.status(403).send(`Acces temporar blocat pentru încercări eșuate repetate. Vă rugăm să încercați din nou mai târziu.`);
    }
    
    const cos = req.session.cos || [];
    let produseInCos = [];
    const utilizator = req.session.utilizator;

    if (cos.length > 0) {
        let db = new sqlite3.Database('./cumparaturi.db', (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Conexiune cu baza de date esuata! - "/vizualizare-cos"');
            }
            //console.log('Conectat la baza de date! - "/vizualizare-cos"');

            const cosIds = cos.map(item => item.id);
            const placeholders = cosIds.map(() => '?').join(',');
            const query = `SELECT * FROM produse WHERE id IN (${placeholders})`;

            db.all(query, cosIds, (err, rows) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Eroare la afisarea produselor! - "/vizualizare-cos"');
                }
                produseInCos = rows.map(row => {
                    const produsCos = cos.find(item => item.id === row.id);
                    return { ...row, cantitate: produsCos ? produsCos.cantitate : 0 };
                });
                res.render('vizualizare-cos', { cos: produseInCos, utilizator: utilizator });
            });

            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
                //console.log('Conexiune cu baza de date inchisa! - "/vizualizare-cos"');
            });
        });
    } else {
        res.render('vizualizare-cos', { cos: produseInCos, utilizator: utilizator });
    }
});

app.post('/golire-cos', (req, res) => {
    req.session.cos = [];
    res.redirect('/vizualizare-cos');
});


// --- Laborator 13 --- 
const multer = require('multer');
const path = require('path');

// Configurarea multer pentru a salva fisierele în directorul 'public/uploads'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // nume unic pentru fisier
    }
});

const upload = multer({ storage: storage });


app.get('/admin', (req, res) => {
    const blockEndTime = req.cookies.blockEndTime;
    const currentTime = Date.now();

    if (blockEndTime && blockEndTime > currentTime) {
        return res.status(403).send(`Acces temporar blocat pentru încercări eșuate repetate. Vă rugăm să încercați din nou mai târziu.`);
    }

    const utilizator = req.session.utilizator;
    res.render('admin', { utilizator: utilizator });
});

app.post('/admin/adauga-produs', upload.single('imagine'), (req, res) => {
    const utilizator = req.session.utilizator;
    if (!utilizator || utilizator.rol !== 'admin') {
        return res.status(403).send('Trebuie să aveți drepturi de administrator pentru a adăuga produse.');
    }
    else {
        const { nume, pret, gramaj } = req.body;
        const imagine = req.file ? `/uploads/${req.file.filename}` : null;

        if (!nume || !pret || !gramaj || !imagine) {
            return res.status(400).send('Toate câmpurile sunt necesare.');
        }

        let db = new sqlite3.Database('./cumparaturi.db', (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Conexiune cu baza de date eșuată! - "/admin/adauga-produs"');
            }

            const query = `INSERT INTO produse (nume, pret, gramaj, imagine) VALUES (?, ?, ?, ?)`;
            db.run(query, [nume, pret, gramaj, imagine], function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Eroare la adăugarea produsului!');
                }
                res.redirect('/admin');
            });

            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
            });
        });
    }
});




//---2---
// verific daca IP-ul este blocat 
app.use((req, res, next) => {
    const blockEndTime = req.cookies.blockEndTime;
    const currentTime = Date.now();

    if (blockEndTime && blockEndTime > currentTime) {
        return res.status(403).send('Acces temporar blocat din cauza încercării de accesare a unor resurse inexistente.');
    } else if (blockEndTime && blockEndTime <= currentTime) {
        res.clearCookie('blockEndTime'); 
    }
    next();
});

// gestionez rutele inexistente
app.use((req, res, next) => {
    const blockEndTime = Date.now() + BLOCK_TIME_SHORT;

    res.cookie('blockEndTime', blockEndTime, { maxAge: BLOCK_TIME_SHORT, httpOnly: true });
    res.status(404).send('Resursa nu a fost găsită.');
});

//---3---
app.use((req, res, next) => {
    const ip = req.ip;
    const currentTime = Date.now();

    if (!failedLoginAttempts[ip]) {
        failedLoginAttempts[ip] = { attempts: 0, lastAttemptTime: 0, blockEndTime: 0 };
    }

    if (failedLoginAttempts[ip].blockEndTime > currentTime) {
        return res.status(403).send(`Acces temporar blocat pentru încercări eșuate repetate. Vă rugăm să încercați din nou mia târziu.`);
    }

    next();
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}`));