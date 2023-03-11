//express framework
const express = require('express');

//testing

//models
const User = require('./src/models/User');
const Animal = require('./src/models/Animal');
const statistics = require('./src/models/Statistics');
const Favorite = require('./src/models/Favorites');


//utility class (specific purposes methods)
const utils = require('./src/utils/Utils');

//creating express app
const server = express();
const app = server;

//express session 

const session = require('express-session');

app.use(session({

    secret: 'secret',
    resave: true,
    saveUninitialized: true,



}));


// defining our view engine
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

//to parse form data
app.use(express.urlencoded({ extended: true }));

//serving static content
app.use(express.static(__dirname + '/public'));

//routes

//Session autentication

app.get('/', (req, res) => {
    if (req.session.logged) {

        res.render('main', {
            login: true,
            name: req.session.name,
            page_name: 'home'

        });

    } else {
        res.render('main', {
            login: false,
            name: '',
            page_name: 'home'

        });
    }
});

app.post('/', (req, res) => {
    Animal.getAllAnimals(0, true)
        .then((results) => {
            res.json(results);
        })
        .catch((rej) => {
            console.log(rej);
        });
});

app.get('/login', (req, res) => {
    res.render("login", { wronguser: "" })
});

app.post('/login', (req, res) => {
    const userName = req.body.user;
    const pwd = req.body.password;

    User.loginUser(userName, pwd)
        .then((resolve) => {
            req.session.logged = resolve.login;
            req.session.name = resolve.user;

            res.cookie("user", userName);
            res.redirect(resolve.link);
        })
        .catch((rej) => {
            res.render("login", { wronguser: "Usuario o contraseña incorrecta" })



        });

});


app.get("/recover", (req, res) => {
    const step = parseInt(req.query.step);

    if (step === 0) {
        res.sendFile("./public/searchEmail.html", {
            root: __dirname
        });
        return;
    }
    res.sendFile("./public/reset.html", {
        root: __dirname
    });
});


// reset password
app.post("/reset", (req, res) => {
    const password = req.body.r_password;
    const email = req.body.email;
    User.updateUserField({name: "email", value: email}, 'password', password);
    res.redirect("/login");
});

app.get('/animal', (req, res) => {
    if (req.session.logged) {
        res.render('animal_adopt', {
            login: true,
            name: req.session.name,
            page_name: 'animal'

        });

    } else {

        res.render('animal_adopt', {
            login: false,
            name: '',
            page_name: 'animal'
        })
    }
});

//list of all animals
app.post('/animal', (req, res) => {
    Animal.getAllAnimals(
        parseInt(
            typeof req.query.page === 'undefined'
                ? 1
                : req.query.page
        ), undefined,
        req.query.specie
    )
        .then((resolve) => {
            res.json(resolve);
        })
        .catch((err) => {
            console.log(err);
        });
});


//Log-out

app.get('/logout', (req, res) => {

    req.session.destroy(() => {
        res.redirect('/')
    })

})


//user registration
app.get('/signup', (req, res) => {

    res.sendFile('./public/register.html', {
        root: __dirname
    });

});

//user registration processing
app.post('/signup', (req, res) => {
    const dni = req.body.national_id;
    const name = req.body.name;
    const lastName = req.body.lastname;
    const birth = req.body.birth;
    const gender = utils.genderTo1Char(req.body.gender);
    const parroquia = req.body.address;
    const sector = req.body.sector;
    const tlf = req.body.tlf;
    const mail = req.body.mail;
    const userName = req.body.user;
    const password = req.body.r_password;

    const user = new User(dni, name, lastName, birth, gender, parroquia, sector, tlf, mail, userName, password);

    User.createUser(user);

    res.cookie("user", userName);
    res.redirect("http://localhost:8081/animal");
});


//form for animal registration
app.get('/animalRegister', (req, res) => {
    if (!req.session.logged) {
        res.redirect("/login");
    }
    res.sendFile('./public/animal_regist.html', {
        root: __dirname
    });

});

app.post('/animalRegister', (req, res) => {
    const name = req.body.name;
    const specie = utils.specieTo1Char(req.body.specie);
    const description = req.body.description;
    const neuter = utils.stringBoolToInt(req.body.isNeutered);
    const age = req.body.animal_age;
    const edad_tipo = req.body.edad_tipo;
    const gender = utils.genderTo1Char(req.body.gender);
    const breed = req.body.breed;
    const isVaccinated = utils.stringBoolToInt(req.body.isVaccinated);
    const owner = req.body.usuario;

    const animal = new Animal(name, specie, breed, description, age, edad_tipo, neuter, isVaccinated, gender, owner);

    Animal.addAnimal(animal)
        .then((resolve) => {
            res.redirect(resolve.link);
        })
        .catch((rej) => {
            res.redirect('http://localhost:8081/animalRegister');
        });
});

app.get('/animal/:id', (req, res) => {
    res.sendFile('/public/animal_info.html', {
        root: __dirname
    });
});

app.post('/animal/:id', (req, res) => {
    Animal.getAnimal(req.params.id)
        .then((resolve) => {
            res.json(resolve);
        })
        .catch((rej) => {
            res.json(rej);
        })
});

app.post('/usuario/:user', (req, res) => {
    let userinfo = req.params.user;

    User.getUserInfo(userinfo, utils.checkUserInfo(userinfo))
        .then((resolve) => {
            res.json(resolve);
        })
        .catch((reject) => {
            res.json(reject);
        });
});

app.get('/favorite/:username', (req, res) => {
    if (req.session.logged) {
        res.render('favorite', {
            login: true,
            name: req.session.name,
            page_name: "favorite"
        });
        res.end();
        return;
    }

    res.redirect("/login");
});

app.post('/favorite', (req, res) => {
    const animalId = req.query.animalId;
    const username = req.query.username;
    const option = req.query.option;

    switch (option) {
        case 'a':
            const favorite = new Favorite(animalId, username);

            Favorite.addFavorite(favorite)
                .then((resolved) => {
                    res.end();
                });
            break;
        case 'g':
            Favorite.getFavorites(username)
                .then((resolved) => {
                    res.json(resolved);
                    res.end();
                })
                .catch((err) => {
                    console.log(err);
                    res.end();
                });
            break;
        case 'd':
            Favorite.deleteFavorite(animalId, username)
                .then((resolved) => {
                    res.json(resolved);
                    res.end();
                })
                .catch((err) => {
                    console.log(err);
                    res.end();
                });
                break;
        default:
            res.send("Error");
            res.end();
            
    }


});


app.get('/statistics/:kind', (req, res) => {
    switch (req.params.kind) {
        case 'animal':
            statistics.getAnimalStats()
                .then((resolved) => {
                    res.json({
                        tipo: "Animales",
                        total: resolved[0]['count(*)']
                    });
                })
                .catch((reject) => {
                    res.json(reject);
                });
            break;
        case 'usuario':
            statistics.getUserStats()
                .then((resolved) => {
                    res.json({
                        tipo: "Usuarios",
                        total: resolved[0]['count(*)']
                    });
                })
                .catch((reject) => {
                    res.json(reject);
                });
            break;
        case 'adopcion':
            statistics.getAdoptionStats()
                .then((resolved) => {
                    res.json({
                        tipo: "Adopciones",
                        total: resolved[0]['count(*)']
                    });
                })
                .catch((reject) => {
                    res.json(reject);
                });
            break;
        default:
            res.redirect("/");
    }
});


//application port, you can change this to any number port as long as it is not being used by something else on your pc
const port = 8081;
app.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server on port ${port}`);
})