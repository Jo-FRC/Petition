var bcrypt = require('bcrypt');

// function hashPassword(plainTextPassword, callback) {
//     bcrypt.genSalt(function(err, salt) {
//         if (err) {
//             return callback(err);
//         }
//         console.log(salt);
//         bcrypt.hash(plainTextPassword, salt, function(err, hash) {
//             if (err) {
//                 return callback(err);
//             }
//             console.log(hash);
//             callback(null, hash);
//         });
//     });
// }
//
//
// function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase, callback) {
//     bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
//         if (err) {
//             return callback(err);
//         }
//         console.log(doesMatch);
//         callback(null, doesMatch);
//     });
// }
//
// _____________________

function hashPassword(plainTextPassword) {
    return new Promise(function(resolve, reject){
        bcrypt.genSalt(function(err, salt){
            if (err){
                reject(err);
            } else {
                bcrypt.hash(plainTextPassword, salt, function(err, hash){
                    if (err) {
                        reject(err);
                    } else {
                        resolve(hash);
                    }
                });
            }
        });
    });
}


function checkPasswordProm(textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject){
        bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
            if (err) {
                reject(err);
            } else {
                console.log(doesMatch);
                resolve(doesMatch);
            }
        });
    });
}

module.exports.hashPassword = hashPassword;
module.exports.checkPasswordProm = checkPasswordProm;
