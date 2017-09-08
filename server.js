// server.js
// where your node app starts
const google = require('googleapis');
const sheets = google.sheets('v4');
const plus = google.plus('v1');
let userName;

// the process.env values are set in .env
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackURL = 'https://'+process.env.PROJECT_DOMAIN+'.glitch.me/login/google/return';
const scopes = ['https://www.googleapis.com/auth/spreadsheets',
              'https://www.googleapis.com/auth/plus.login'];
const oauth2Client = new google.auth.OAuth2(clientID, clientSecret, callbackURL);

const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'online',
  // If you only need one scope you can pass it as a string
  scope: scopes
});

// init project
const express = require('express');
const app = express();
const expressSession = require('express-session');

// cookies are used to save authentication
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
app.use(express.static('views'))
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({ secret:'watchingmonkeys', resave: true, saveUninitialized: true }));

//Book Data JSON transformer
const bookDataTrans = require('./src/transformer.js');

// index route
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// on clicking "logoff" the cookie is cleared
app.get('/logoff',
  function(req, res) {
    res.clearCookie('google-auth');
    res.redirect('/');
  }
);

app.get('/auth/google', function(req, res) {
  res.redirect(url);
});

app.get('/login/google/return', function(req, res) {
    oauth2Client.getToken(req.query.code, function (err, tokens) {
      // Tokens contains an access_token and a refresh_token if you set access type to offline. Save them.
      if (!err) {
        oauth2Client.setCredentials({
          access_token: tokens.access_token
        });
        res.redirect('/setcookie');
      } else {
        console.log("Aww, man: " + err);
      }
    });
  }
);

// on successful auth, a cookie is set before redirecting
// to the success view
app.get('/setcookie',
  function(req, res) {
    res.cookie('google-auth', new Date());
    res.redirect('/login-success');
  }
);

// if cookie exists, success. otherwise, user is redirected to index
app.get('/login-success',
  function(req, res) {
    if(req.cookies['google-auth']) {
      res.sendFile(__dirname + '/views/app.html');
    } else {
      res.redirect('/');
    }
  }
);

app.post('/submit-book-data', function(req, res) {
    let bookJSON;
    try {
      bookJSON = JSON.parse(req.body.bookdata);
    }catch(e) {
      console.log(`JSON parsing failed, bad data:${req.body.bookdata}`);
      res.sendStatus(422);
      return;
    }
    // Get Google+ details
    plus.people.get({
      userId: 'me',
      auth: oauth2Client
    }, function (err, response) {
      if (err) {
        console.log("Aww, man: " + err);
        res.send("An error occurred");
      } else { 
        if(response.isPlusUser==true){
          userName = response.name.givenName;
        } else {
          userName = "Unknown Stranger";        
        }

        // Now get spreadsheet values
        const request = {
          // The ID of the spreadsheet to send data to.
          spreadsheetId: process.env.SHEET_KEY,
          range: 'Sheet1', 
          auth: oauth2Client,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: "INSERT_ROWS",
          resource: {values: bookDataTrans(bookJSON)}
        };
      
        sheets.spreadsheets.values.append(request, function(err, response) {
          if (err) {
            console.log("Aww, man: " + err);
            res.send("An error occurred");
          } else {
            console.log("Data sent successfully!");
            res.sendStatus(201);
          }
        });
      }
    });
  }
);


// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
