var express = require('express'),
    app = express(),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    hb = require('express-handlebars'),
    db = require('./db'),
    cookieSession = require('cookie-session'),
    bcryptPass = require('./bcryptPass'),
    hashPassword = bcryptPass.hashPassword,
    checkPasswordProm = bcryptPass.checkPasswordProm,
    csrf = require('csurf'),
    csrfProtection = csrf({ cookie: true }),
    cookieParser = require('cookie-parser');


app.disable('x-powered-by');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(express.static("./public/"));

app.use(require('body-parser').urlencoded({
    extended: false
}));

app.use(cookieSession({
    secret: 'a really hard to guess secret',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(cookieParser());

app.use(function(req, res, next) {
    if (req.url != '/signup' && req.url != '/login') {
        if (!req.session.user) {
            res.redirect('/signup');
        } else {
            next();
        }
    } else {
        next();
    }
});

app.use(function(err, req, res, next){
    console.log(err);
    res.sendStatus(500);
});

function requireNotLoggedIn(req, res, next) {
    if (req.session.user) {
        res.redirect('/petition');
    } else {
        next();
    }
}

function notSigned(req, res, next) {
    if (!req.session.user.sigId) {
        res.redirect('/petition');
    } else {
        next();
    }
}


app.get('/profiles', csrfProtection, function(req, res){
    res.render('profiles', {
        csrfToken : req.csrfToken()
    });
});

app.post('/profiles', csrfProtection, function(req, res){
    if (req.body.age || req.body.city || req.body.homepage) {
        console.log(req.session.user);
        db.query("INSERT INTO profiles(user_id, age, city, url)  VALUES ($1, $2, $3, $4) RETURNING id",[req.session.user.id, req.body.age, req.body.city, req.body.homepage]).then(function(result){
            res.redirect('/petition');
        }).catch(function(err){
            res.render('profiles', {
                csrfToken : req.csrfToken()
            });
        });
    } else {
        res.redirect('/petition');
    }
});

app.get('/signup', requireNotLoggedIn, function(req, res){
    if (req.session.user){
        res.redirect('/petition');
        return;
    } else {
        res.render('signup');
    }
});

app.post('/signup', function(req, res){
    if (req.session.user){
        res.redirect('/petition');
        return;
    }
    if (req.body.firstname && req.body.lastname && req.body.email && req.body.password) {
        bcryptPass.hashPassword(req.body.password).then(function(hash){
            return db.query("INSERT INTO users(first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id",[req.body.firstname, req.body.lastname, req.body.email, hash]).then(function(result){
                req.session.user = {
                    email : result.rows[0].email,
                    firstname : result.rows[0].firstname,
                    lastname : result.rows[0].lastname,
                    id : result.rows[0].id
                };
                if (req.session.user) {
                    res.redirect('/profiles');
                }
            });
        }).catch(function(err){
            console.log(err);
            res.render('signup', {
                tryagain : "Please fill in all informations required"
            });
        });

    }
});

app.get('/login', requireNotLoggedIn, function(req, res){
    if (req.session.user){
        res.redirect('/petition');
        return;
    }else {
        res.render('login');
    }
});

app.post('/login', function(req, res){
    if (req.session.user){
        res.redirect('/petition');
        return;
    }
    if (req.body.email && req.body.password) {
        db.query('select users.id as users_id, users.first_name, users.last_name, password, signatures.id as sig_id from users left join signatures ON users.id = signatures.user_id WHERE email = $1',[req.body.email]).then(function(result){
            bcryptPass.checkPasswordProm(req.body.password, result.rows[0].password).then(function(doesMatch){
                if (doesMatch){
                    console.log('matched');
                    req.session.user = {
                        email :result.rows[0].email,
                        firstname : result.rows[0].firstname,
                        lastname : result.rows[0].lastname,
                        id : result.rows[0].users_id,
                        sigId : result.rows[0].sig_id
                    };
                    res.redirect('/petition');
                } else {
                    console.log("NO match");
                    res.render('login', {
                        Wrong : "Wrong Email or Password"
                    });
                }
            });

        }).catch(function(err){
            console.log(err);
            res.render('login', {
                Wrong : "Wrong Email or Password"
            });
        });

    }
});

app.get('/petition', csrfProtection, function(req, res) {
    if(req.session.user.sigId) {
        console.log(req.session.user.sigId);
        res.redirect('/petition/success');
    } else {
        db.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.session.user.id]).then(function(result){
            res.render('layout/index', {
                firstname : result.rows[0].first_name,
                lastname : result.rows[0].last_name,
                upper : "",
                lower : "",
                csrfToken : req.csrfToken()
            });
        });
    }
});

app.get('/petition/success', notSigned, csrfProtection, function(req, res) {
    var id = req.session.user.sigId;
    db.query("SELECT signature FROM signatures WHERE id = $1",[id]).then(function(result){
        db.query("SELECT COUNT(*) FROM signatures").then(function(data){
            res.render('success', {
                signature : result.rows[0].signature,
                number : data.rows[0].count,
                csrfToken : req.csrfToken()
            });
        }).catch(function(err){
            res.render('failure', {
                csrfToken : req.csrfToken()
            });
        });
    });
});

app.post('/petition', csrfProtection, function(req, res) {
    if (req.body.signature) {
        console.log(req.session.user);
        db.query("INSERT INTO signatures(signature, user_id) VALUES ($1, $2) RETURNING id",[req.body.signature, req.session.user.id]).then(function(result){
            req.session.user.sigId = result.rows[0].id;
            res.redirect('/petition/success');
        }).catch(function(err){
            console.log(err);
            res.render('failure', {
                csrfToken : req.csrfToken()
            });
        });
    } else {
        res.render('failure', {
            csrfToken : req.csrfToken()
        });
    }
});

app.get('/petition/success/signers', csrfProtection, function(req, res) {
    db.query("SELECT users.first_name, users.last_name, profiles.age, profiles.city, profiles.url FROM signatures left join profiles ON signatures.user_id = profiles.user_id left join users ON signatures.user_id = users.id").then(function(names){
        var signees = names.rows;
        res.render('signees', {
            signees
        });
    }).catch(function (err) {
        console.log(err);
    });
});

app.get('/edit', csrfProtection, function(req, res){
    db.query('SELECT * FROM users left join profiles ON user_id = users.id WHERE users.id = $1', [req.session.user.id]).then(function(result){
        res.render('edit', {
            firstname : result.rows[0].first_name,
            lastname : result.rows[0].last_name,
            email : result.rows[0].email,
            age : result.rows[0].age,
            city : result.rows[0].city,
            homepage : result.rows[0].url,
            csrfToken : req.csrfToken()
        });
    });
});


app.post('/edit', csrfProtection, function(req, res){
    var usersTablePromise;
    var profileTablesPromise;
    if (req.body.password){
        usersTablePromise = bcryptPass.hashPassword(req.body.password).then(function(hash){
            return db.query("UPDATE users SET first_name = $1, last_name = $2, email = $3 password = $4 WHERE id = $5",
            [req.body.firstname || null, req.body.lastname || null, req.body.email || null, hash, req.session.user.id]);
        });
    } else {
        usersTablePromise = db.query("UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4",
        [req.body.firstname || null, req.body.lastname || null, req.body.email || null, req.session.user.id]);
    }
    profileTablesPromise = db.query("INSERT INTO profiles(user_id, age, city, url)  VALUES ($1, $2, $3, $4)",[req.session.user.id, req.body.age, req.body.city, req.body.homepage]).catch(function(err){
        return db.query("UPDATE profiles SET age = $1, city = $2, url = $3 WHERE user_id = $4",
        [req.body.age, req.body.city, req.body.homepage, req.session.user.id]);
    });
    Promise.all([usersTablePromise, profileTablesPromise]).then(function(result){
        req.session.user.firstname = req.body.firstname;
        req.session.user.lastname = req.body.lastname;
        req.session.user.email = req.body.email;
        req.session.user.age = req.body.age;
        req.session.user.city = req.body.city;
        req.session.user.homepage = req.body.homepage;
        res.redirect('/petition');
    }).catch(function(err){
        console.log(err);
        res.render('edit', {
            csrfToken : req.csrfToken()
        });
    });
});

app.get('/petition/success/signers/:city', function(req, res) {
    var city = req.params.city;
    db.query("SELECT * FROM signatures LEFT JOIN profiles ON profiles.user_id = signatures.user_id LEFT JOIN users ON users.id = signatures.user_id WHERE city =$1 ",
    [city])
    .then(function(result){
        res.render('signees', {
            csrfToken: req.csrfToken(),
            signatures: result.rows,
            city : req.body.city
        });
    });
});

app.post('/petition/delete', csrfProtection, function(req, res) {
    db.query('DELETE FROM signatures WHERE id = $1', [req.session.user.sigId]).then(function() {
        delete req.session.user.sigId;
        res.redirect('/petition');
    });
});

app.get('/logout', function(req, res){
    req.session = null;
    res.redirect('/signup');
});

app.listen(process.env.PORT || 8080, function(){
    console.log("I'm lstening on 8080!");
});
