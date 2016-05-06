// Constants
var PORT = 8080;

var express = require('express');
//var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('mongo:27017');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var qr = require('qr-image');

// App
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/img", express.static(path.join(__dirname, 'img')));

/// catch 404 and forwarding to error handler
/*app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});*/


// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

/* GET New User page. */
app.get('/newtalk', function(req, res) {
    res.render('newtalk', { title: 'Add New Talk' });
});

/* GET New User page. */
app.get('/edittalk', function(req, res) {
	var objectId = req.query.id;
    var db = req.db;
    var collection = db.get('talks');
    collection.findById(objectId, function(err, doc){
    	if (err) {
    		res.send("There was a problem finding the talk object");
    	}
    	else
    	{
    		res.render('edittalk', { title: 'Edit Talk', "talk" : doc });
    	}
    });
    
});

app.post('/edit', function(req, res) {
    var objectId = req.body.mongoid;
    var db = req.db;
    var collection = db.get('talks');

    var keywords = [req.body.keyword1,req.body.keyword2,req.body.keyword3,req.body.keyword4];
	keywords = keywords.filter(Boolean);

	collection.findAndModify(
      {
        "query": { "_id": objectId },
        "update": { "$set": { 
            "title" : req.body.title,
        	"presenter" : req.body.presenter,
        	"pi" : req.body.pi,
        	"email" : req.body.email,
        	"website" : req.body.website,
        	"keyword" : keywords,
        	"qrcode" : qr.imageSync(req.body.website, { type: 'svg' }),
        	"theme" : req.body.theme
        }},
        "options": { "new": true, "upsert": true }
      },
      function(err,doc) {
        if (err) throw err;
        res.redirect("admin");
      });

    
});

/* POST to Add User Service */
app.post('/addtalk', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    

    // Set our collection
    var collection = db.get('talks');
    var keywords = [req.body.keyword1,req.body.keyword2,req.body.keyword3,req.body.keyword4];
	keywords = keywords.filter(Boolean);
    // Submit to the DB
    collection.insert({
    	"title" : req.body.title,
        "presenter" : req.body.presenter,
        "pi" : req.body.pi,
        "email" : req.body.email,
        "website" : req.body.website,
        "keyword" : keywords,
        "qrcode" : qr.imageSync(req.body.website, { type: 'svg' }),
        "theme" : req.body.theme
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // And forward to success page
            res.redirect("admin");
        }
    });
});

app.get('/listtalks', function(req, res) {
    var db = req.db;
    var collection = db.get('talks');
    collection.find({},{},function(e,docs){
        res.render('listtalks', {
            "talklist" : docs
        });
    });
});

app.get('/admin', function(req, res) {
    var db = req.db;
    var collection = db.get('talks');
    collection.find({},{},function(e,docs){
        res.render('admin', {
            "talklist" : docs
        });
    });
});

/*app.get('/deletetalk', function(req, res) {
    var objectId = req.query.id;
    var db = req.db;
    var collection = db.get('talks');

    collection.remove({ _id : objectId}, function (err) {
		collection.find({},{},function(e,docs){
        	res.render('admin', {
        	    "talklist" : docs
        	});
    	});
	});
});*/

app.get('/', function(req, res) {
    var db = req.db;
    var collection = db.get('talks');
    var alltalks = {};

    collection.find({theme:"ecology"},{},function(e,docs){
   		alltalks.ecology = docs;
   		collection.find({theme:"cities"},{},function(e,docs){
   			alltalks.cities = docs;
			collection.find({theme:"global"},{},function(e,docs){
				alltalks.globals = docs;
				collection.find({theme:"resources"},{},function(e,docs){
					alltalks.resources = docs;
					collection.find({theme:"structures"},{},function(e,docs){
						alltalks.structures = docs;
						res.render('displayalltalks', {
            				"alltalks" : alltalks
        				});
   					});
   				});
   			});
   		});
    });
});

app.post('/keywordsearch', function(req, res) {	
    var searchString = req.body.keyword;
    var db = req.db;
    var collection = db.get('talks');
    var regex = new RegExp(["^", searchString, "$"].join(""), "i");
    collection.find({ "keyword": regex },{},function(e,docs){
        res.render('listtalks', {
            "talklist" : docs
        });
    });
});

app.get('/viewtalk', function(req, res) {
    var objectId = req.query.id;
    var db = req.db;
    var collection = db.get('talks');
    collection.findById(objectId, function(err, doc){
    	if (err) {
    		res.send("There was a problem finding the talk object");
    	}
    	else
    	{
    		res.render('viewtalk', {
            	"talk" : doc
        	});
    	}
    });
});

app.get('/dumpdb',function(req,res) {
	var collection = db.get('talks');
    collection.find({},{},function(e,docs){
        res.send(docs);
    });
});


app.get('/restoredb',function(req,res) {
	var restore_data = [{"_id":"56c23dbf5aa95301002f055a","title":"TREX 2016: Using sensor networks to collect environmental data at high spatial resolution and low cost","presenter":"Gabriel Isaacman-VanWertz","pi":"Jesse Kroll","email":"givw@mit.edu","website":"krollgroup.mit.edu","keyword":["Air quality","Sensors","TREX","Atmospheric Chemistry"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM13 1h1v1h-1zM15 1h1v1h1v1h1v1h-1v1h-1v-1h-1zM17 1h1v1h-1zM19 1h7v7h-7zM2 2v5h5v-5zM10 2h2v3h-2v1h1v1h-1v2h-1v-6h1zM20 2v5h5v-5zM3 3h3v3h-3zM13 3h1v1h-1zM21 3h3v3h-3zM12 5h1v2h-1zM14 5h1v1h2v-1h1v4h-1v1h-2v-1h1v-1h1v-1h-1v1h-1v-1h-1zM11 7h1v1h1v-1h1v1h1v1h-1v1h-1v-1h-1v1h1v1h-1v2h1v1h-2v-2h-2v1h1v2h-1v-1h-2v-1h1v-1h-1v-1h1v-1h1v1h1v-1h1zM1 9h1v1h-1zM3 9h5v1h-1v1h-1v-1h-2v1h2v1h1v1h-2v1h-1v-2h-1v-1h-1v-1h1zM19 9h5v2h2v1h-3v-2h-2v3h3v1h1v1h1v1h-1v1h-1v-2h-1v-1h-2v1h2v1h-1v1h2v2h-1v-1h-1v1h1v1h-1v1h2v1h-2v1h-1v-1h-1v1h-2v-1h-2v-1h1v-3h-2v-1h1v-1h-1v1h-1v1h-1v-2h1v-1h-1v-1h3v1h1v1h1v1h2v-3h-1v-3h1v-1h-1zM17 10h2v1h-2zM13 11h1v1h-1zM16 11h1v1h-1zM2 12h1v2h-1zM15 12h1v1h-1zM17 12h1v1h-1zM25 13h1v1h-1zM1 14h1v4h-1zM3 14h1v1h-1zM5 14h1v1h-1zM4 15h1v3h-2v-2h1zM6 15h2v1h-2zM10 15h1v1h-1zM18 15h1v1h-1zM8 16h2v1h-1v1h-2v-1h1zM11 17h1v1h-1zM9 18h2v1h3v1h-1v2h-2v1h-1v1h-1v-4h1v-1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM19 19h1v1h-1zM24 19h2v1h-2zM2 20v5h5v-5zM15 20h1v1h-1zM3 21h3v3h-3zM25 21h1v5h-3v-1h2v-2h-1v-1h1zM13 22h3v1h2v1h1v1h1v1h-2v-1h-2v-1h-1v1h-1v1h-1v-2h1v-1h-1zM20 23h1v1h-1zM23 23h1v1h-1zM10 24h1v1h-1zM21 24h1v1h-1zM9 25h1v1h-1zM11 25h1v1h-1zM15 25h1v1h-1z\"/></svg>","theme":"global"},{"_id":"56c33cf298d4b001005e420a","title":"Collective dynamics of energy demands","presenter":"Marta Gonzalez","pi":"","email":"martag@mit.edu","website":"humnetlab.mit.edu","keyword":["Energy","Transportation","Networks"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM11 1h2v1h-1v2h-1v1h2v1h1v2h-1v-1h-1v1h1v1h-2v1h-1v-1h-1v-6h1v-1h1zM14 1h1v1h1v-1h1v1h1v4h-1v-1h-2v-1h1v-1h-1v1h-2v-2h1zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM21 3h3v3h-3zM16 6h1v1h-1zM10 7v1h1v-1zM15 7h1v1h1v-1h1v2h-1v1h-1v-1h-1zM1 9h1v3h-1zM3 9h5v1h-3v2h-1v-2h-1zM19 9h5v2h-1v-1h-4zM9 10h1v2h-1zM11 10h1v2h-1zM14 10h2v1h1v-1h1v1h1v1h-1v1h-1v1h-2v-1h1v-1h-1v1h-1zM7 11h1v1h-1zM21 11h1v1h-1zM24 11h2v3h-1v1h1v2h-1v-1h-3v-1h1v-1h-2v-1h3zM3 12h1v2h-1v1h-1v3h-1v-5h2zM5 12h2v1h-2zM12 12h1v1h-1zM7 13h4v1h-4zM13 13h1v1h-1zM18 13h2v1h-2zM5 14h1v1h4v1h1v-2h1v1h2v1h-1v2h-1v-1h-4v-1h-1v1h-1v1h-2v-1h1zM17 14h1v1h-1zM20 14h1v2h-1zM16 15h1v1h-1zM18 15h1v1h1v1h4v1h-2v5h-1v-1h-1v1h-2v-1h-1v1h-1v-1h-1v-1h1v-1h1v-1h-1v1h-1v1h-1v1h-1v-2h1v-1h-1v-1h4v-2h1zM3 16h1v1h-1zM15 16h1v1h-1zM7 17h1v1h-1zM9 18h2v2h-1v-1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM19 19h1v1h-1zM24 19h2v7h-8v-1h7v-2h-1v-1h1v-1h-1zM2 20v5h5v-5zM9 20h1v4h-1zM3 21h3v3h-3zM11 21h1v1h-1zM23 21h1v1h-1zM11 23h3v1h-1v2h-4v-1h1v-1h1v1h1v-1h-1zM20 23h1v1h-1zM22 23h1v1h-1zM15 24h1v1h-1zM17 24h1v1h-1z\"/></svg>","theme":"global"},{"_id":"56c33d1698d4b001005e420e","title":"Costs, benefits and biogeography of marine nitrogen fixation","presenter":"Michael Follows","pi":"","email":"mick@mit.edu","website":"paocweb.mit.edu/research/mick-follows-group","keyword":["Ocean","Climate","Modeling"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 35 35\"><path d=\"M1 1h7v7h-7zM12 1h1v1h1v1h-2zM15 1h3v1h-1v1h1v-1h1v3h-1v-1h-3v-1h1v-1h-1zM20 1h1v1h-1zM23 1h2v1h1v1h-1v2h-1v-2h-3v-1h2zM27 1h7v7h-7zM2 2v5h5v-5zM10 2h1v2h1v1h-2zM28 2v5h5v-5zM3 3h3v3h-3zM29 3h3v3h-3zM14 4h1v1h-1zM20 4h1v2h-1zM22 4h1v1h-1zM12 5h1v2h-1zM17 5h1v1h-1zM23 5h1v1h1v1h-1v2h-1v1h-1v-1h-1v1h-1v-2h1v-2h2zM9 6h2v1h-1v1h-1zM14 6h1v1h-1zM18 6h1v1h-1zM11 7h1v1h-1zM13 7h1v1h-1zM15 7h1v2h2v2h1v2h-1v-1h-1v-2h-3v-1h1zM17 7h1v1h-1zM19 7h1v1h-1zM22 7v1h1v-1zM25 7h1v2h1v1h1v-1h1v2h-1v1h-1v-1h-1v2h2v2h1v-1h1v1h1v-1h1v1h1v2h1v1h-1v1h1v5h-1v-2h-1v-3h-1v1h-1v1h-1v-1h-1v1h-1v-2h3v-1h2v-2h-2v2h-1v-2h-1v2h-1v-1h-1v-1h-1v1h-2v2h-1v-1h-2v-1h-1v1h-1v-2h1v-1h1v1h1v1h1v-1h2v-1h-2v-1h2v-2h1zM18 8h1v1h-1zM1 9h1v1h-1zM4 9h1v2h1v3h-2v1h-1v-1h-2v-1h1v-3h2zM6 9h2v1h-2zM9 9h1v1h-1zM12 9h1v1h1v1h-1v1h1v1h-1v1h1v1h1v5h-2v-2h1v-2h-2v1h-3v-1h2v-1h1v-1h-2v-1h2v-1h-2v-1h1v-1h1zM8 10h1v1h-1zM21 10h1v1h-1zM23 10h1v2h-2v-1h1zM30 10h1v1h1v1h-1v1h-1v-1h-1v-1h1zM32 10h2v3h-1v1h-1v-2h1v-1h-1zM3 11v2h1v-2zM7 11h1v1h-1zM20 11h1v2h-1zM9 12h1v1h-1zM15 12h1v1h-1zM28 12h1v1h-1zM7 13h2v1h-2zM6 14h1v1h1v1h-1v1h1v1h-2v-2h-1v-1h1zM16 14h3v1h-3zM25 14v1h1v-1zM33 14h1v1h-1zM21 15h1v1h-1zM1 16h2v1h2v3h2v1h1v1h-2v-1h-1v1h1v1h-2v-1h-2v-3h-1v-1h1v-1h-1zM16 16h1v1h-1zM12 17h1v1h-1zM25 17h1v1h-1zM8 18h1v1h-1zM10 18h1v1h-1zM17 18h1v1h-1zM24 18h1v1h-1zM26 18h1v1h-1zM3 19v2h1v-2zM7 19h1v1h-1zM11 19h1v2h-2v1h-1v-1h-1v-1h3zM19 19h1v1h1v1h-1v1h2v1h1v-2h1v-1h1v-1h1v2h-1v1h-1v3h-1v1h-1v-2h-1v-1h-1v1h-1v-2h-1v1h-1v1h-1v-4h3zM23 19h1v1h-1zM22 20h1v1h-1zM12 21h1v1h-1zM14 21h1v2h-2v-1h1zM26 21h1v1h2v1h2v4h-1v2h1v3h-3v-1h-1v-1h-2v-6h1v1h1v-1h1v-1h-3v-1h1zM30 21h1v1h-1zM31 22h1v1h-1zM1 23h3v1h-1v1h-1v-1h-1zM7 23h5v1h-2v1h-1v-1h-2zM6 24h1v1h1v1h-4v-1h2zM12 24h2v1h-2zM15 24h1v1h1v-1h1v1h3v1h1v1h1v1h-1v1h-1v1h2v1h1v2h-1v1h-1v-3h-2v-3h1v-1h-1v-1h-4v1h-1v-1h-1v-1h1zM29 24v1h1v-1zM1 25h1v1h-1zM10 25h2v1h-2zM9 26h1v1h-1zM13 26h1v1h-1zM26 26v3h3v-3zM33 26h1v1h-1zM1 27h7v7h-7zM11 27h2v1h-1v3h1v2h1v1h-2v-2h-1v-1h-2v-1h2v-1h-2v-1h2zM27 27h1v1h-1zM32 27h1v1h1v2h-1v-1h-1zM2 28v5h5v-5zM16 28h2v2h-1v1h-1v-1h-2v-1h2zM3 29h3v3h-3zM23 29h1v1h-1zM18 30h1v2h1v1h-2v1h-1v-1h-3v-1h1v-1h1v1h2zM24 30h1v1h-1zM32 30h1v1h-1zM33 31h1v1h-1zM25 32h3v1h2v1h-5zM9 33h1v1h-1zM32 33h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c33d2a98d4b001005e420f","title":"Structure of viral infection networks in the ocean","presenter":"Kathryn Kauffman","pi":"Martin Polz","email":"k6logc@mit.edu","website":"polzlab.mit.edu","keyword":["Ocean","Virus","Networks"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h2v1h-2zM12 1h2v1h2v1h1v-1h-1v-1h2v3h-2v1h1v2h-1v-1h-2v-1h1v-2h-1v1h-1v-1h-2v-1h1zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM9 3h2v1h1v2h-1v-1h-1v-1h-1zM21 3h3v3h-3zM9 6h2v1h-1v1h-1zM11 7h1v1h-1zM13 7h1v2h1v-2h1v1h1v-1h1v3h-1v-1h-1v2h-2v-1h-1v-1h-1v-1h1zM10 8h1v1h-1zM1 9h1v1h-1zM3 9h1v1h1v1h3v1h-3v2h-1v2h1v1h1v1h-2v-1h-1v-1h-2v-1h1v-2h1v-1h1v-1h-1zM7 9h2v1h-2zM11 9h1v1h-1zM20 9h1v2h-2v-1h1zM23 9h1v3h-1v1h-2v3h1v-1h1v3h1v-1h2v4h-2v-1h1v-1h-1v1h-1v2h-1v2h1v2h-3v-1h1v-1h-1v-1h1v-1h-4v1h-1v-3h1v-2h-1v1h-2v-2h1v-1h-1v1h-3v2h-1v1h-1v-3h1v-1h1v-3h1v3h1v-3h1v-1h1v2h-1v1h2v-2h1v1h2v-1h1v-1h1v-1h1v-1h1zM25 9h1v4h-2v-1h1zM9 10h2v1h-2zM12 10h1v1h1v1h-1v1h-1zM16 11h1v1h-1zM18 11h1v2h-2v-1h1zM8 12h1v3h-1v-1h-2v-1h2zM23 14h1v1h-1zM25 14h1v2h-1zM6 15h2v1h-2zM18 15v2h2v-1h-1v-1zM16 16v1h1v-1zM1 17h2v1h-2zM7 17h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM11 19h2v1h-1v1h2v-1h1v2h-1v1h2v3h-2v-1h1v-1h-1v1h-3v1h-2v-1h1v-1h-1v-1h2v-2h-1v-1h1zM19 19h1v1h-1zM2 20v5h5v-5zM3 21h3v3h-3zM12 22v2h1v-2zM17 23h2v1h1v1h-1v1h-2zM23 23h3v1h-3zM25 25h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c33d2f98d4b001005e4210","title":"The simple mathematics of impenetrable tropical swamp forests","presenter":"Charles Harvey","pi":"","email":"charvey@mit.edu","website":"web.mit.edu/harvey-lab/","keyword":["Marine","Forests"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM14 1h2v1h-2zM17 1h1v3h-1v1h-1v-1h-1v-1h1v-1h1zM19 1h7v7h-7zM2 2v5h5v-5zM10 2h3v1h-2v3h-1v3h-1v-6h1zM20 2v5h5v-5zM3 3h3v3h-3zM13 3h1v1h-1zM21 3h3v3h-3zM14 4h1v2h-3v-1h2zM17 5h1v1h-1zM11 6h1v3h1v1h-2zM15 6h2v1h-1v2h1v-2h1v4h-1v-1h-2v1h-1v2h5v-1h-1v-1h2v-1h-1v-1h5v1h-1v1h3v3h-2v1h2v1h-1v1h1v1h-1v1h1v1h-1v1h1v5h-3v-1h2v-2h-4v-1h-1v1h-1v-1h-2v1h1v1h1v2h-1v-1h-3v-1h-2v1h1v1h-5v-1h1v-1h1v1h1v-1h-1v-1h3v-1h-1v-2h1v1h1v2h1v-2h1v-2h-1v-1h-2v-1h1v-1h1v-1h1v-1h-6v-1h2v-3h1v-1h1zM13 7h1v1h-1zM1 9h1v2h1v1h-1v1h-1zM3 9h5v1h-1v1h1v1h-2v-2h-2v1h-1zM9 10h2v3h-2v-1h1v-1h-1zM21 10v3h-1v1h-1v1h1v1h1v-1h2v-1h-2v-1h1v-3zM15 11h2v1h-2zM3 12h1v1h2v1h-1v1h-2v-1h-1v-1h1zM23 12v1h1v-1zM7 13h1v1h-1zM1 14h1v4h-1zM20 14h1v1h-1zM5 15h3v1h-1v1h1v-1h1v1h1v1h2v1h-1v1h-1v-1h-1v-1h-4v-1h1v-1h-1zM10 15h4v1h-1v2h-1v-1h-1v-1h-1zM3 16h1v2h-1zM17 16v1h1v-1zM22 16v1h2v-1zM13 18h1v1h-1zM18 18v3h3v-3zM22 18v3h2v-2h-1v-1zM1 19h7v7h-7zM14 19h1v1h-1zM19 19h1v1h-1zM2 20v5h5v-5zM9 20h1v1h1v1h-1v2h-1zM3 21h3v3h-3zM20 25h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c33d3498d4b001005e4211","title":"Light and organic matter constraints on mercury cycling in aquatic systems","presenter":"Claudia Gelfond","pi":"Ben Kocar","email":"gelfond@mit.edu","website":"web.mit.edu/kocar/www/index.html","keyword":["Mercury","Synchrotron","Natural Organic Matter"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 31 31\"><path d=\"M1 1h7v7h-7zM9 1h3v2h-3zM13 1h4v1h-2v1h-2zM18 1h4v1h-3v1h-1v1h-1v-2h1zM23 1h7v7h-7zM2 2v5h5v-5zM24 2v5h5v-5zM3 3h3v3h-3zM19 3h1v1h-1zM21 3h1v1h-1zM25 3h3v3h-3zM9 4h1v1h-1zM12 4h2v1h-2zM15 4h2v1h-1v1h-1zM18 4h1v1h-1zM20 4h1v1h1v3h-1v-1h-1v1h-1v-1h-1v1h1v1h1v-1h1v1h1v1h1v-1h1v1h2v-1h1v1h1v-1h2v2h-4v2h-2v-1h1v-1h-1v1h-1v-1h-3v1h-2v1h-1v-2h2v-1h-1v-1h-1v2h-2v1h-1v-3h1v1h1v-2h1v-1h-1v-1h1v-1h1v1h2zM10 5h1v1h1v2h-1v-1h-1zM13 6h2v1h-1v1h-1zM9 7h1v1h1v1h-2zM15 7h1v1h-1zM1 9h1v1h-1zM3 9h2v1h-1v1h4v-1h-2v-1h3v4h-1v-1h-2v1h2v1h-3v-2h-1v5h1v3h2v1h-2v1h-1v-2h-1v-2h-1v-1h-1v-1h1v-1h1v-3h-1v-1h1zM11 9h2v1h-1v2h-1v1h2v-1h1v3h-1v2h1v1h-2v-2h-1v-2h-1v-4h1zM21 12h2v1h-1v1h-1zM1 13h1v1h-1zM15 13h2v1h-1v1h-1zM18 13h1v2h-1v2h-1v-1h-1v-1h1v-1h1zM27 13h2v1h-2zM8 14h1v1h-1zM20 14h1v1h2v1h-1v1h-2v-1h-1v-1h1zM23 14h2v2h2v1h-1v1h-1v-1h-2v-1h1v-1h-1zM26 14h1v1h-1zM29 14h1v2h-2v-1h1zM6 15h2v1h-2zM14 15h1v1h-1zM5 16h1v1h-1zM9 16h1v1h-1zM15 16h1v1h1v1h-1v1h1v1h-1v1h1v-1h2v2h1v1h1v-2h1v-1h-1v-2h1v1h1v1h1v1h2v1h1v1h-1v1h1v1h-1v1h1v1h1v1h-1v1h-3v-3h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h-1v1h-1v-2h-3v-1h-1v-2h2zM7 17h1v1h-1zM10 17h1v1h-1zM19 17h1v3h-1v-1h-2v-1h2zM22 17h1v1h-1zM28 17h1v1h-1zM6 18h1v1h-1zM24 18h1v1h-1zM26 18h2v1h-1v1h3v3h-1v-1h-2v-1h-1v-1h-1v-1h1zM1 19h1v1h-1zM7 19h2v1h-2zM10 19h1v3h-1v3h-1v-3h-2v-1h3zM20 20h1v1h-1zM2 21h1v1h-1zM12 21h1v1h-1zM11 22h1v1h1v-1h1v2h1v-1h1v2h-3v-1h-2zM22 22v3h3v-3zM1 23h7v7h-7zM23 23h1v1h-1zM27 23h2v1h-2zM2 24v5h5v-5zM29 24h1v1h-1zM3 25h3v3h-3zM11 25h1v2h-2v1h-1v-2h2zM18 25h1v1h-1zM27 25h2v1h-2zM16 26h2v4h-1v-1h-1v-1h1v-1h-1zM29 26h1v2h-1zM12 27h1v1h2v1h-3zM15 27h1v1h-1zM20 27h1v1h2v2h-4v-2h1zM25 27v1h1v-1zM28 28h1v2h-1zM9 29h1v1h-1zM15 29h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c33d3898d4b001005e4212","title":"Passive sampling in tidal environments","presenter":"Noa K. Yoder","pi":"Phil Gschwend","email":"noayoder@mit.edu","website":"cee.mit.edu/gschwend","keyword":["Ocean","Sampling","Contaminants"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h2v1h-2zM12 1h4v2h-1v-1h-1v1h1v1h1v4h-1v-1h-1v2h-1v-2h-1v-1h3v-1h-1v-1h-1v-1h-2v-1h1zM19 1h7v7h-7zM2 2v5h5v-5zM17 2h1v1h-1zM20 2v5h5v-5zM3 3h3v3h-3zM9 3h2v2h-1v-1h-1zM21 3h3v3h-3zM17 4h1v1h-1zM11 5h1v1h-1zM9 6h1v2h-1zM11 7h1v1h-1zM17 7h1v1h-1zM10 8h1v1h-1zM1 9h1v1h1v-1h1v1h3v1h-3v1h-1v1h1v2h-1v-1h-1v-2h-1zM7 9h2v1h-2zM11 9h2v1h-1v1h-1zM17 9h1v2h-1v2h1v1h1v-1h1v-1h1v4h1v-3h1v1h1v1h-1v3h1v2h-1v-1h-1v1h1v2h-1v2h-2v-1h1v-1h-3v1h1v1h1v1h-2v1h-1v-3h-3v-2h1v-1h-1v1h-2v1h-1v4h-2v-1h1v-1h-1v-1h1v-2h1v-1h2v-2h-1v-1h2v-1h1v2h-1v1h2v1h1v-1h-1v-5h-1v1h-1v-2h2v-3h1zM20 9h1v2h-1v1h-1v-2h1zM23 9h1v1h-1zM25 9h1v3h-1zM9 10h1v1h1v1h1v1h-1v1h-1v2h-1v-1h-1v-1h1v-1h1v-1h-1zM22 10h1v1h-1zM7 11h1v1h-1zM14 11h1v1h-1zM21 11h1v1h-1zM23 11h1v1h-1zM5 12h1v1h2v1h-3zM24 12h1v1h-1zM12 13h1v1h-1zM25 13h1v7h-1v-2h-1v-2h1zM1 15h2v1h-2zM5 15h1v1h-1zM7 15h1v1h-1zM11 15h2v1h-1v1h-1v1h-1v-2h1zM17 15v2h1v-1h1v1h1v-1h-1v-1zM3 16h2v2h-1v-1h-1zM1 17h2v1h-2zM7 17h2v1h-2zM9 18h1v1h1v1h-2zM11 18h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM19 19h1v1h-1zM2 20v5h5v-5zM3 21h3v3h-3zM25 21h1v1h-1zM23 22h2v1h1v1h-3zM12 23h1v1h-1zM14 24h1v2h-3v-1h2zM22 24h1v1h-1zM21 25h1v1h-1zM25 25h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c33d4f98d4b001005e4213","title":"Rainfall enhancement due to irrigation in East Africa","presenter":"Ross Evan Alter","pi":"Elfatih Eltahir","email":"ralter1@mit.edu","website":"eltahir.mit.edu","keyword":["Irrigation","Rainfall","Attribution"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h1v1h1v2h1v4h-1v-1h-1v-1h1v-1h-1v-1h-1zM11 1h1v1h-1zM13 1h1v3h-2v-1h1zM16 1h2v8h1v1h-1v1h1v1h-3v-1h1v-2h-1v-1h1v-1h-1v-1h-1v-1h2v-1h-1v-1h1v-1h-1zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM21 3h3v3h-3zM9 5h1v1h-1zM13 5h1v1h-1zM9 7h1v1h-1zM13 7h1v1h1v6h1v-1h1v1h2v1h2v-1h1v2h-1v1h1v-1h1v-1h3v3h-1v-1h-1v1h-2v1h2v1h-1v2h-3v1h-1v-1h-1v1h-2v3h-2v-1h1v-3h-2v-2h1v1h1v-1h2v-2h-1v1h-3v1h-1v-1h-1v-2h-1v-1h1v-1h3v-1h-2v-1h-1v-2h1v-1h2v-1h-1zM15 7h1v1h-1zM1 9h1v1h-1zM4 9h6v1h-6zM21 9h1v1h1v-1h3v1h-1v1h-2v1h2v-1h1v2h-3v1h-1v-1h-1v1h-2v-2h1v-2h1zM2 10h1v1h-1zM1 11h1v1h-1zM3 11h3v2h-1v1h-1v1h-1v-1h-1v-1h1zM7 11h1v1h-1zM9 11h1v2h-1zM13 11v2h1v-2zM6 13h2v1h-1v1h-1v1h-1v1h-2v-1h1v-1h1v-1h1zM10 13h1v2h-1v1h-1v-2h1zM1 14h1v1h1v1h-1v2h-1zM7 15h1v1h-1zM15 15v1h-2v1h-1v1h3v-1h4v-1h-3v-1zM6 16h1v1h-1zM5 17h1v1h-1zM7 17h1v1h-1zM9 17h1v3h1v2h-1v1h-1zM18 18v3h3v-3zM24 18h1v1h-1zM1 19h7v7h-7zM19 19h1v1h-1zM25 19h1v1h-1zM2 20v5h5v-5zM24 20h1v2h-1zM3 21h3v3h-3zM11 22h1v1h-1zM25 22h1v4h-1v-1h-3v1h-2v-1h1v-2h1v1h2v-1h1zM10 23h1v1h-1zM13 23h1v1h-1zM18 23h1v1h-1zM9 25h2v1h-2zM17 25h2v1h-2z\"/></svg>","theme":"resources"},{"_id":"56c33d5498d4b001005e4214","title":"Nature-based solutions for coastal defense","presenter":"Maria Maza","pi":"Heidi Nepf","email":"mazame@mit.edu","website":"web.mit.edu/nepf/www/people-new.html","keyword":["Ocean","Natural Ecosystems","Modeling","Coastal Defence"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 31 31\"><path d=\"M1 1h7v7h-7zM12 1h3v1h1v-1h1v2h1v1h-2v-1h-1v1h-1v-1h-1v-1h-1zM19 1h3v1h-3zM23 1h7v7h-7zM2 2v5h5v-5zM10 2h2v1h-1v1h1v1h-2v1h1v1h-1v1h1v1h-2v-6h1zM24 2v5h5v-5zM3 3h3v3h-3zM12 3h1v1h-1zM25 3h3v3h-3zM13 4h1v6h2v1h1v1h1v1h1v1h2v-1h-2v-2h1v1h1v-1h1v1h1v-1h-1v-1h1v-1h5v1h2v1h-1v1h1v1h-1v1h1v1h-3v2h-2v1h1v1h1v2h1v1h-1v1h-1v3h-4v1h4v1h1v1h-1v1h-4v-1h2v-1h-2v1h-1v-1h-1v-1h-1v1h-1v1h-1v1h-1v-3h1v-1h-1v-1h1v-1h-1v-1h2v2h1v1h2v-1h-1v-2h-2v-2h2v1h1v-1h-1v-1h1v-1h-2v-1h2v-1h-2v-1h2v-1h-4v-1h-2v-1h1v-1h-1v1h-2v1h-1v-1h-1v1h1v1h-3v-2h1v-1h1v-1h1v1h2v-1h-2v-3h1v-2h-1v-1h1zM15 4h1v1h-1zM18 4h1v1h2v-1h1v5h-1v2h-1v-3h1v-2h-2v1h-1v2h-3v-2h1v1h1v-1h-1v-1h1v-1h1zM11 7h1v1h-1zM19 7h1v1h-1zM1 9h1v1h-1zM3 9h5v1h-1v1h1v1h-1v1h-1v-3h-3zM18 9h1v1h-1zM9 10h2v1h-1v1h-1zM17 10h1v1h-1zM1 11h1v1h3v1h-2v1h2v1h-1v1h1v-1h1v1h1v1h-1v1h-1v-1h-2v-2h-1v3h2v1h-2v3h-1v-8h1v-1h-1zM25 11v2h-3v1h2v1h-2v4h1v2h1v-1h1v-1h-2v-1h1v-3h1v-1h2v-1h1v-1h-1v-1zM26 12h1v1h-1zM7 13h1v1h-1zM13 14h1v4h-1v-1h-2v1h2v1h-2v1h1v2h1v-1h1v2h-2v1h1v1h-1v1h1v-1h1v3h-1v2h-1v-2h-3v-4h2v-3h-2v-1h1v-4h3zM7 15h1v1h-1zM16 15h1v2h-2v-1h1zM7 17h2v2h-1v-1h-1zM18 17h1v1h-1zM27 17h1v1h2v1h-3zM6 18h1v1h1v1h-2zM14 18h2v1h1v1h-2v1h-1v-1h-1v-1h1zM17 18h1v1h-1zM3 20h2v1h-2zM17 20h1v1h-1zM29 20h1v1h-1zM5 21h3v1h-3zM15 21h1v1h-1zM9 22h1v1h-1zM22 22v3h3v-3zM29 22h1v1h-1zM1 23h7v7h-7zM23 23h1v1h-1zM2 24v5h5v-5zM15 24h1v1h-1zM28 24h1v1h-1zM3 25h3v3h-3zM27 25h1v1h2v1h-1v2h-1v-1h-1v-1h-1v-1h1zM10 26v1h1v-1zM15 26h1v1h-1zM14 28h1v2h-1zM19 28h1v1h-1zM9 29h2v1h-2zM18 29h1v1h-1zM27 29h1v1h-1z\"/></svg>","theme":"resources"},{"_id":"56c33d5998d4b001005e4215","title":"Wetting and microfluidics","presenter":"Benzhong Zhao","pi":"Ruben Juanes","email":"zhaob@mit.edu","website":"juanesgroup.mit.edu","keyword":["Microfluidics","Pattern Formation","Porous Media"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM10 1h3v1h-2v2h1v4h-1v-2h-2v-1h1v-2h-1v-1h1zM15 1h2v1h1v1h-2v1h1v3h-1v2h1v-2h1v3h-3v-1h-1v1h-1v-3h1v1h1v-1h-1v-1h2v-1h-1v-2h-1v-1h1zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM12 3h1v1h-1zM21 3h3v3h-3zM13 4h1v2h-1zM9 7h1v1h-1zM1 9h1v1h1v-1h1v2h-2v3h-1zM5 9h1v1h-1zM7 9h1v1h-1zM11 9h1v1h-1zM21 9h1v1h-1zM24 9h1v1h1v2h-4v-2h1v1h1zM8 10h1v1h-1zM10 10h1v1h-1zM12 10h1v1h-1zM19 10h1v1h1v1h-3v1h-2v-1h1v-1h2zM4 11h1v1h1v2h-1v2h1v1h-2v-2h-2v-1h1v-2h1zM7 11h1v1h-1zM9 11h1v1h-1zM11 11h1v3h-1v-1h-1v-1h1zM14 11h1v1h-1zM21 12h1v1h-1zM7 13h3v2h-2v-1h-1zM13 13h1v1h1v1h-1v1h1v-1h1v1h1v1h1v-1h1v1h1v-1h1v1h1v2h2v-1h2v4h-1v-2h-3v1h1v3h-1v2h-2v-1h1v-1h-1v-1h1v-1h-2v1h-1v-1h-1v-2h-1v-1h-1v-2h-2v-1h-1v-2h1zM18 13h2v3h-1v-2h-1zM24 13h2v4h-2v-2h1v-1h-1zM6 14h1v1h1v1h-2zM17 14h1v1h-1zM23 14h1v1h-1zM1 15h1v1h-1zM2 16h1v1h-1zM8 16h1v1h-1zM1 17h1v1h-1zM3 17h1v1h-1zM6 17h2v1h-2zM11 17h2v2h-1v1h-1zM9 18h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM14 19h1v1h-1zM19 19h1v1h-1zM2 20v5h5v-5zM12 20h1v1h-1zM3 21h3v3h-3zM9 21h3v1h-1v2h-2v-1h1v-1h-1zM13 21h1v1h1v1h-1v1h1v-1h2v1h1v2h-3v-1h-2v-1h-1v-2h1zM25 23h1v1h-1zM19 24h1v1h-1zM24 24h1v1h1v1h-2zM9 25h1v1h-1zM11 25h2v1h-2z\"/></svg>","theme":"resources"},{"_id":"56c33d5d98d4b001005e4216","title":"The reactive carbon budget of the atmosphere","presenter":"Sarah Safieddine","pi":"Colette Heald","email":"sarahsaf@mit.edu","website":"web.mit.edu/heald/www/people.html","keyword":["Volatile Organic Compounds","Atmospheric Chemistry","Reactive Gases"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 31 31\"><path d=\"M1 1h7v7h-7zM9 1h4v1h-1v2h-1v-1h-2zM16 1h2v1h-1v2h-4v-2h1v1h1v-1h1zM20 1h2v1h-2zM23 1h7v7h-7zM2 2v5h5v-5zM18 2h1v1h-1zM24 2v5h5v-5zM3 3h3v3h-3zM21 3h1v1h-1zM25 3h3v3h-3zM9 4h2v1h-2zM12 4h1v1h-1zM17 4h2v2h-1v-1h-1zM20 4h1v1h1v3h-1v-1h-1v1h1v1h1v1h1v-1h1v1h2v-1h1v1h1v-1h2v2h-4v2h-3v-2h-3v2h-1v-2h-2v2h-6v-1h-1v-1h-2v-1h-2v-1h3v1h1v-1h-1v-2h1v1h1v1h2v1h-2v1h1v1h1v-2h1v2h1v-1h1v-1h1v-1h1v-1h1v-2h1zM11 5h1v1h1v-1h2v1h-1v2h1v-2h1v4h-2v-1h-1v-2h-1v1h-1zM17 7h1v1h-1zM1 9h1v1h-1zM3 9h2v1h1v1h-2v-1h-1zM2 10h1v1h1v2h1v1h-1v1h1v-1h1v1h2v-1h3v2h2v1h-1v2h-1v-2h-1v-1h-1v2h-2v-1h1v-1h-1v1h-1v-1h-2v1h-2v1h-1v-3h1v1h1v-4h-1v1h-1v-2h1zM7 11h1v1h-1zM24 11v1h1v-1zM5 12h1v1h-1zM8 12h2v1h-2zM21 12h1v2h-1zM7 13h1v1h-1zM18 13h1v1h2v1h2v-1h2v2h2v1h-1v1h-1v-1h-1v-1h-2v1h-2v1h-1v-2h1v-1h-2zM27 13h2v1h-2zM12 14h3v1h-1v1h-1v-1h-1zM26 14h1v1h-1zM29 14h1v2h-2v-1h1zM15 15h1v1h-1zM17 15h1v2h-1v2h1v1h1v1h1v2h1v-2h1v-1h-1v-2h1v1h1v2h3v1h1v1h-1v1h1v1h-1v1h1v1h1v1h-1v1h-4v-1h1v-2h-1v1h-2v-2h-1v1h-2v1h2v2h1v-1h1v2h-3v-2h-2v-1h-4v-1h2v-1h4v-1h-1v-1h1v-1h-1v1h-1v-1h-1v-1h1v-1h-1v-4h1zM14 16h1v1h-1zM13 17h1v1h-1zM22 17h1v1h-1zM28 17h1v1h-1zM2 18h4v1h-2v1h1v1h-1v1h-2v-1h1v-2h-1zM14 18h1v1h-1zM18 18h1v1h-1zM24 18h1v1h-1zM26 18h2v1h-1v1h3v3h-1v-1h-2v-1h-1v-1h-1v-1h1zM1 19h1v1h-1zM7 19h1v1h-1zM9 19h1v1h-1zM12 19h2v1h-1v1h2v1h1v1h-1v1h-1v-2h-2v1h1v1h-2v1h-2v-3h1v-2h2zM20 20h1v1h-1zM5 21h1v1h-1zM7 21h1v1h-1zM22 22v3h3v-3zM1 23h7v7h-7zM23 23h1v1h-1zM27 23h2v1h1v1h-1v1h-2v-1h1v-1h-1zM2 24v5h5v-5zM3 25h3v3h-3zM11 25h2v1h-1v2h3v1h-1v1h-2v-1h-1v1h-2v-1h1v-1h1v-1h-1v1h-1v-2h2zM29 26h1v2h-1zM25 27v1h1v-1zM16 28h1v2h-2v-1h1zM28 28h1v2h-1z\"/></svg>","theme":"resources"},{"_id":"56c33d6298d4b001005e4217","title":"Bottom-up design of biocrude oils","presenter":"Diego Lopez Barreiro","pi":"Markus Buehler","email":"dlopezb@mit.edu","website":"web.mit.edu/mbuehler/www/","keyword":["Biocrude Oil","Multiscale","Modeling","Hydrothermal Liquefaction"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM14 1h1v1h-1zM17 1h1v1h-1zM19 1h7v7h-7zM2 2v5h5v-5zM10 2h1v1h-1zM13 2h1v2h-1zM15 2h2v2h-1v-1h-1zM20 2v5h5v-5zM3 3h3v3h-3zM9 3h1v1h1v1h-1v1h1v-1h1v1h1v1h-1v1h-1v-1h-1v2h-1zM21 3h3v3h-3zM14 4h2v1h-2zM13 5h1v1h-1zM17 5h1v4h-1v1h-1v1h-1v-1h-2v-1h-1v-1h1v-1h1v2h1v-3h2zM16 7v1h1v-1zM1 9h1v1h-1zM3 9h5v1h-1v1h-1v2h2v1h-1v1h1v-1h2v-1h-2v-1h1v-1h1v1h1v-1h-1v-2h1v1h2v1h-1v1h1v-1h2v1h-1v1h1v2h2v1h-1v1h2v-2h-1v-1h-1v-3h1v-1h1v1h2v-1h-1v-1h5v1h-1v1h3v3h-2v1h2v1h-1v1h1v1h-1v1h1v2h-2v-2h-1v-1h-1v3h2v1h2v4h-3v-1h2v-2h-4v-1h-1v1h-1v-1h-3v2h1v-1h1v1h1v2h-1v-1h-2v1h-2v-1h1v-1h-1v-1h1v-1h-1v1h-2v-1h-2v1h1v2h-1v-1h-1v-4h1v1h1v-1h2v1h2v-1h-1v-1h1v-1h-1v1h-1v-1h-1v-1h-1v2h-2v-1h-2v-1h2v-1h-3v2h-1v-2h-1v1h-1v-2h-1v3h-1v-4h1v-1h1v-1h-1v-1h2v1h1v-1h-1v-1h-1zM21 10v3h-1v1h-1v1h1v1h1v-1h2v-1h-2v-1h1v-3zM7 11h1v1h-1zM1 12h1v1h-1zM18 12v1h1v-1zM23 12v1h1v-1zM4 13v1h1v1h1v-1h-1v-1zM11 14v1h-1v1h1v-1h3v-1zM20 14h1v1h-1zM13 16v1h2v-1zM22 16v1h2v-1zM18 18v3h3v-3zM1 19h7v7h-7zM16 19v2h1v-2zM19 19h1v1h-1zM2 20v5h5v-5zM3 21h3v3h-3zM12 24h1v1h-1zM9 25h1v1h-1zM20 25h1v1h-1z\"/></svg>","theme":"resources"},{"_id":"56c33d7a98d4b001005e4218","title":"Uncovering elastin’s shape and flexibility for hierarchical assembly","presenter":"Anna Tarakanova","pi":"Markus Buehler","email":"annat@mit.edu","website":"news.mit.edu/2016/uncovering-secrets-elastin-blood-vessel-skin-flexibility-0205","keyword":["Elastin","Molecular Structure","Flexibility"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 39 39\"><path d=\"M1 1h7v7h-7zM10 1h2v1h2v1h-2v2h3v-1h2v1h1v1h-2v3h-1v-2h-1v-1h-4v3h-1v-6h1zM14 1h3v2h-2v-1h-1zM20 1h1v1h-1zM22 1h1v1h-1zM24 1h1v1h-1zM27 1h1v1h-1zM29 1h1v4h-1v-1h-2v-1h1v-1h1zM31 1h7v7h-7zM2 2v5h5v-5zM25 2h1v2h-1zM32 2v5h5v-5zM3 3h3v3h-3zM17 3h1v1h-1zM22 3h1v1h-1zM33 3h3v3h-3zM10 4v1h1v-1zM18 4h1v1h-1zM23 4h2v2h-1v-1h-1zM26 4h1v1h-1zM20 5h2v1h-2zM27 5h1v1h-1zM18 6h2v2h1v1h-1v1h-2v-1h1v-2h-1zM22 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM11 7h1v2h-1zM13 7h1v3h2v-1h1v1h1v1h-3v1h-1v-1h-1zM17 7h1v2h-1zM21 7h1v1h-1zM23 7h1v3h-1v-1h-1v-1h1zM25 7h1v1h-1zM27 7h1v1h1v2h-3v-1h1zM29 7h1v1h-1zM1 9h1v1h1v1h1v1h-3zM3 9h5v1h-1v1h1v-1h2v1h-1v2h-1v-1h-1v1h-2v-1h1v-1h-2v-1h-1zM21 9h1v1h-1zM31 9h5v1h1v1h1v3h-5v-1h-1v-3h-1zM11 10h1v1h-1zM20 10h1v1h-1zM24 10h1v1h-1zM30 10h1v2h-1zM33 10v2h1v1h2v-2h-1v-1zM10 11h1v1h-1zM12 11h1v1h-1zM21 11h2v1h1v2h-1v-1h-1v1h1v1h-1v1h-1v-1h-1v-2h1zM26 11h3v1h1v1h2v1h-3v-1h-1v-1h-2zM11 12h1v1h-1zM13 12h1v1h-1zM15 12h1v3h-2v-1h1zM17 12h1v1h1v1h-1v2h-2v-1h1zM19 12h1v1h-1zM2 13h1v1h-1zM4 13h1v1h-1zM7 13h1v1h-1zM10 13h1v1h-1zM25 13h2v3h-2v-1h1v-1h-1zM3 14h1v1h-1zM8 14h1v1h2v1h1v-1h2v1h-1v1h-2v3h-1v-1h-1v1h1v2h3v1h-2v1h-1v-1h-2v-1h-4v-1h2v-1h1v1h1v-1h-1v-1h1v-1h-1v1h-1v-2h3v1h1v-1h-1v-1h-2v-1h1zM11 14h1v1h-1zM24 14h1v1h-1zM1 15h1v1h2v1h-1v2h1v2h-3v-1h1v-3h-1zM19 15h1v1h1v1h-1v1h-3v1h3v1h-3v1h4v1h1v1h1v1h2v1h2v-1h1v2h-3v1h-1v-1h-1v-1h-1v1h1v1h-7v-1h-1v1h-2v1h1v2h-1v1h-1v-2h-1v-1h-2v-1h-1v-1h-1v1h1v1h-1v1h-1v1h-1v-2h-2v-1h3v-1h-2v-1h5v1h1v1h1v-1h2v-1h3v-2h1v-1h-1v-2h-2v1h-3v-1h2v-1h3v-1h-1v-1h4zM28 15h1v1h-1zM30 15h2v1h-2zM35 15h1v1h-1zM37 15h1v1h-1zM14 16h1v1h-1zM22 16h1v1h-1zM24 16h1v1h-1zM27 16h1v1h1v1h-2v1h2v-1h1v1h2v1h1v1h4v1h-2v1h-1v-1h-1v2h-1v2h-1v1h1v-1h1v1h2v1h-1v1h2v-2h2v1h-1v2h-1v1h2v7h-6v-1h-1v-1h1v-1h1v2h4v-1h-2v-2h-1v1h-1v-1h-1v1h-1v1h-1v-2h-2v-2h1v-1h-1v-1h-1v1h1v1h-2v-2h-1v-1h2v-2h2v-1h1v-1h-1v-1h-1v-1h4v-1h-4v1h-2v-2h1v-1h-2v-1h1v-1h-1v-1h2zM32 16h1v1h-1zM4 17h1v1h-1zM23 17h1v1h-1zM30 17h2v1h-2zM33 17h1v1h-1zM35 17h2v1h-2zM12 18h1v1h-1zM20 18h1v1h-1zM24 18h1v1h-1zM34 18h1v1h3v1h-4zM5 19h1v1h-1zM21 19h1v1h-1zM23 19h1v1h-1zM22 20h1v1h-1zM23 21h2v2h-1v-1h-1zM2 22h1v1h-1zM14 22h1v2h-1zM18 22v2h-1v2h2v-1h1v1h1v-3h-2v-1zM3 23h1v2h-1zM7 23h1v1h-1zM35 23h3v2h-2v-1h-1zM1 24h1v1h-1zM9 24h1v1h-1zM33 24h2v1h1v2h-1v-1h-2zM10 25h1v1h-1zM1 26h1v4h-1zM15 27h1v1h-1zM23 27h1v1h1v1h-4v-1h2zM25 27h1v1h-1zM8 28h1v1h-1zM17 28h1v1h-1zM28 28v1h3v-1zM3 29h1v1h-1zM7 29h1v1h-1zM15 29h1v1h-1zM18 29h1v1h3v1h2v1h-1v1h-1v-1h-1v-1h-2v1h2v1h-3v1h-1v-1h-2v-2h2v1h1v-1h-1v-1h1zM9 30h1v1h-1zM24 30h1v1h-1zM30 30v3h3v-3zM34 30v1h1v-1zM1 31h7v7h-7zM11 31h1v1h-1zM13 31h1v3h3v1h1v1h-1v2h-4v-2h3v-1h-3zM31 31h1v1h-1zM2 32v5h5v-5zM9 32h1v4h-1zM24 32h2v1h1v2h1v1h-2v-2h-1v-1h-1zM34 32v1h3v-1zM3 33h3v3h-3zM11 33h1v2h1v1h-2zM21 33h1v2h2v2h4v1h-5v-1h-1v-1h-1v-1h-2v-1h2zM23 33h1v1h-1zM24 34h1v1h-1zM36 34v1h1v-1zM29 36h1v1h-1zM9 37h3v1h-3zM18 37h1v1h-1zM20 37h2v1h-2zM30 37h1v1h-1z\"/></svg>","theme":"structures"},{"_id":"56c33d8098d4b001005e4219","title":"3D printing of bio-inspired composites","presenter":"Daly Wettermark and Grace Gu","pi":"Markus Buehler","email":"dalyw@mit.edu","website":"web.mit.edu/mbuehler/www/index.html","keyword":["Biomaterials","3D Printing","Composites"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 31 31\"><path d=\"M1 1h7v7h-7zM11 1h2v3h-1v-1h-2v-1h1zM16 1h2v1h-2zM20 1h2v8h-1v2h-2v1h-1v1h-3v-1h1v-1h1v-1h1v-1h2v-1h1v-2h-1v-1h1v-1h-1v-1h1v-1h-1zM23 1h7v7h-7zM2 2v5h5v-5zM18 2h1v1h-1zM24 2v5h5v-5zM3 3h3v3h-3zM9 3h1v1h1v1h2v1h-1v2h1v1h-1v1h-2v-1h-1zM15 3h1v1h-1zM17 3h1v1h-1zM25 3h3v3h-3zM13 4h1v1h-1zM18 4h1v1h-1zM14 5h3v2h-1v1h-1v-1h-1v1h-1v-2h1zM10 6v2h1v-2zM18 6h1v1h-1zM17 7h1v2h-2v-1h1zM19 7h1v1h-1zM14 8h1v1h-1zM1 9h1v1h-1zM3 9h5v1h-1v1h1v-1h2v1h-1v1h-2v1h1v1h-3v-1h1v-1h-1v-1h1v-1h-1v1h-1v1h-2v-1h1zM15 9h1v1h-1zM23 9h5v1h2v1h-1v1h1v1h-1v1h1v1h-3v2h-2v1h1v1h1v2h1v1h-1v1h-1v3h-5v-1h-2v-1h1v-1h1v-1h-1v-1h1v-1h1v1h2v-1h1v-1h-2v-1h1v-1h-3v-2h-1v1h-1v-1h-2v-1h1v-1h1v1h2v-1h1v1h2v1h-1v1h1v-1h1v-1h2v-1h1v-1h-1v-1h-2v2h-1v-1h-1v-1h-1v-1h1zM9 12h1v2h2v1h-2v1h-1v-1h-1v-1h1zM13 12h1v2h2v1h1v1h1v1h1v1h3v1h-3v1h-1v-1h-1v-1h-2v-1h1v-1h-1v1h-1v-1h-1zM20 12h1v1h-1zM26 12h1v1h-1zM1 13h1v1h1v-1h1v1h1v1h3v1h-1v1h-3v-2h-3zM2 16h1v1h1v1h1v1h-1v1h1v1h4v1h-5v-1h-1v-2h-1v3h-1v-4h1zM10 16h1v2h-1zM12 16h1v1h-1zM7 17h2v1h-2zM13 17h1v1h-1zM27 17h1v1h2v1h-3zM9 18h1v1h-1zM11 18h1v1h-1zM5 19h4v1h-4zM12 19h1v1h-1zM16 19h1v2h-2v-1h1zM11 20h1v1h1v1h-2zM19 20h1v1h-1zM29 20h1v1h-1zM18 21h1v1h-1zM9 22h1v1h-1zM13 22h3v1h1v1h-2v1h-1v-1h-1v2h-3v1h1v1h-2v-4h1v1h2v-2h1zM17 22h1v1h-1zM19 22h1v1h-1zM22 22v3h3v-3zM29 22h1v1h-1zM1 23h7v7h-7zM10 23h1v1h-1zM23 23h1v1h-1zM2 24v5h5v-5zM17 24h1v1h-1zM29 24h1v1h-1zM3 25h3v3h-3zM15 25h1v1h-1zM18 25h1v1h-1zM27 25h2v1h1v1h-1v2h-1v-1h-1v-1h-1v-1h1zM13 26h1v1h-1zM19 26h1v1h-1zM14 27h3v2h-2v1h-3v-1h1v-1h1zM21 27h5v1h1v1h-1v1h-2v-2h-2v1h-1zM9 29h1v1h-1zM17 29h2v1h-2zM20 29h1v1h-1zM27 29h1v1h-1z\"/></svg>","theme":"structures"},{"_id":"56c33d8798d4b001005e421a","title":"Building characterization through seismic wave propagation","presenter":"Hao Sun","pi":"Oral Buyukozturk","email":"haosun@mit.edu","website":"web.mit.edu/haosun/www/","keyword":["Building Monitoring","Seismic Interferometry","Wave Propagation"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h1v1h-1zM11 1h1v1h-1zM15 1h1v2h1v1h-2v1h-1v-1h-3v-1h1v-1h3zM19 1h7v7h-7zM2 2v5h5v-5zM17 2h1v1h-1zM20 2v5h5v-5zM3 3h3v3h-3zM9 3h1v1h-1zM21 3h3v3h-3zM10 4h1v1h-1zM17 4h1v1h-1zM11 5h1v4h1v3h-1v-2h-1zM13 5h1v1h-1zM15 5h1v3h1v2h1v1h-1v1h1v2h1v-1h1v-1h1v4h1v-3h1v1h1v1h-1v3h2v-1h-1v-1h1v-3h1v9h-1v-1h-1v-1h1v-1h-1v1h-1v-1h-1v1h1v2h-1v2h-2v-1h1v-1h-6v-2h2v-2h-1v-1h2v-1h1v1h1v-1h-1v-1h-2v1h-1v-1h-1v-1h2v-1h-2v-1h1v-1h-1v-1h1v-1h-1v-2h-1v-1h1zM9 6h1v2h-1zM17 6h1v2h-1zM13 7h1v1h-1zM1 9h1v1h-1zM3 9h1v2h-1v1h-1v1h-1v-2h1v-1h1zM7 9h2v1h1v1h-1v2h-1v-1h-1v1h-1v-2h-1v-1h2v1h1v-1h-1zM20 9h1v2h-1v1h-1v-2h1zM23 9h1v1h-1zM25 9h1v3h-1zM21 11h2v1h-2zM4 12h1v1h-1zM11 12h1v2h-1zM13 12h1v5h-2v-1h1zM24 12h1v1h-1zM2 13h1v1h1v1h-1v1h-2v-1h1zM5 13h1v1h-1zM7 13h1v1h-1zM9 14h2v1h-1v2h2v1h-2v2h-1v-4h-3v1h2v1h-4v-1h-1v-1h2v-1h4zM11 15h1v1h-1zM15 16h1v1h-1zM1 17h2v1h-2zM15 18h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM12 19h1v1h-1zM19 19h1v1h-1zM2 20v5h5v-5zM10 20h2v1h-1v3h2v-2h-1v-1h2v1h1v1h-1v2h1v-1h1v2h-3v-1h-3v-1h-1v-1h1zM3 21h3v3h-3zM23 22h2v1h1v1h-3zM16 23h1v1h-1zM18 23h1v1h1v1h-2v1h-1v-2h1zM22 24h1v1h-1zM9 25h1v1h-1zM21 25h1v1h-1zM25 25h1v1h-1z\"/></svg>","theme":"structures"},{"_id":"56c33d8b98d4b001005e421b","title":"Smaller than the eye can see: measuring subtle motions with video cameras","presenter":"Justin Chen","pi":"Oral Buyukozturk","email":"ju21743@mit.edu","website":"people.csail.mit.edu/ju21743/","keyword":["Vibrations","Sensing","Cameras"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 31 31\"><path d=\"M1 1h7v7h-7zM9 1h1v1h1v1h2v-2h1v2h1v-1h1v-1h2v1h-1v2h-3v1h-1v1h-2v-1h1v-1h-1v1h-2v-1h1v-1h-1zM11 1h1v1h-1zM20 1h2v2h-1v-1h-1zM23 1h7v7h-7zM2 2v5h5v-5zM18 2h2v2h1v2h1v2h-1v-1h-1v-1h-1v1h-1v-2h-1v-1h2v-1h-1zM24 2v5h5v-5zM3 3h3v3h-3zM25 3h3v3h-3zM14 5h1v1h-1zM10 6h1v1h-1zM13 6h1v2h-1zM15 6h1v4h-3v1h-1v-3h1v1h1v-1h1zM9 7h1v2h-1zM11 7h1v1h-1zM17 7h1v1h-1zM19 7h1v1h-1zM18 8h1v2h-1v1h-1v2h-3v-1h1v-1h1v-1h1v-1h1zM20 8h1v1h-1zM1 9h1v1h-1zM3 9h2v2h1v3h-1v-1h-1v2h-1v-1h-1v-1h1v-1h-1v1h-1v-2h1v-1h1v1h1v-1h-1zM6 9h3v1h1v1h-2v-1h-2zM23 9h1v2h1v1h1v1h-2v-1h-2v-2h1zM26 9h1v1h-1zM28 9h2v2h-1v-1h-1zM20 10h1v1h-1zM25 10h1v1h-1zM7 11h1v1h-1zM10 11h2v1h1v1h-1v1h1v-1h1v1h1v1h-1v1h-1v-1h-3v-1h-1v-2h1zM13 11h1v1h-1zM18 11h1v1h-1zM27 11h2v2h-1v-1h-1zM19 12h3v2h-1v-1h-1v1h1v2h-3v-2h-1v-1h2zM7 13h1v1h-1zM27 13h1v1h-1zM29 13h1v3h-2v-1h1zM8 14h1v1h-1zM23 14h1v1h-1zM26 14h1v3h-1zM1 15h2v1h1v-1h2v1h1v1h-2v1h-2v1h-1v-1h-1zM7 15h1v1h-1zM15 15h1v1h-1zM22 15h1v1h-1zM24 15h1v1h-1zM8 16h5v1h-1v1h-1v-1h-1v2h1v1h-2v-1h-1v-1h1v-1h-1zM14 16h1v1h-1zM16 16h1v1h-1zM21 16h1v1h1v1h-1v1h2v-2h2v1h-1v1h2v1h-2v1h2v-1h1v3h-2v4h-1v3h-1v-4h-1v2h-1v2h-1v-3h1v-1h-1v-2h-1v-1h1v-1h-1v-1h2v-1h-1zM7 17h1v1h-1zM28 17h1v1h-1zM14 18h1v1h-1zM19 18h1v1h-1zM1 19h1v1h-1zM3 19h2v2h3v1h-6v-1h1zM6 19h2v1h-2zM8 20h1v1h-1zM11 20h3v1h1v1h1v-2h3v2h-1v-1h-1v2h-2v1h-1v1h-1v1h-2v1h2v-1h2v-1h2v1h-1v1h1v-1h1v1h2v1h-2v1h-1v-1h-2v-1h-1v3h-1v-2h-1v1h-1v-1h-2v-2h1v-1h-1v-3h2v1h-1v1h1v-1h2v-1h-1v-1h-1zM23 20v1h1v-1zM29 21h1v2h-1zM22 22v3h3v-3zM1 23h7v7h-7zM17 23h1v2h-1zM23 23h1v1h-1zM28 23h1v1h1v2h-1v-1h-1zM2 24v5h5v-5zM19 24h1v2h-2v-1h1zM3 25h3v3h-3zM27 25h1v1h1v1h-1v1h-1zM29 27h1v1h-1zM26 28h1v2h-1zM28 28h1v2h-1zM9 29h1v1h-1zM16 29h1v1h-1zM18 29h1v1h-1z\"/></svg>","theme":"structures"},{"_id":"56c33d9098d4b001005e421c","title":"Biopolymers beween polymorphism and advanced fabrication","presenter":"Benedetto Marelli","pi":"","email":"bmarelli@mit.edu","website":"cee.mit.edu/marelli","keyword":["Biopolymers","Biofrabrication","Living Materials"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h2v1h-2zM13 1h1v1h1v1h-1v1h2v1h1v-1h1v4h-1v-2h-1v2h1v1h-1v1h2v2h1v1h1v-2h1v3h-2v1h-2v1h1v1h2v-1h1v-2h2v-1h-1v-1h1v-1h1v2h2v1h-2v1h-1v1h-1v2h1v-2h1v6h1v-2h1v3h-1v2h1v1h-5v-1h2v-6h-1v3h-1v1h-1v2h-1v-1h-1v-1h1v-1h-2v-5h-1v1h-2v-1h1v-1h1v-1h-2v-1h-1v-1h1v-2h1v-1h-3v-1h3v-2h-1v-1h1v-1h-2v1h-1v-2h1zM15 1h3v1h-3zM19 1h7v7h-7zM2 2v5h5v-5zM11 2h1v2h-1zM20 2v5h5v-5zM3 3h3v3h-3zM16 3h1v1h-1zM21 3h3v3h-3zM9 4h2v1h-1v1h2v2h-1v-1h-1v1h1v3h-2v1h-2v1h1v1h-3v-3h3v-1h-1v-1h2zM13 7h1v1h-1zM1 9h1v1h3v1h-2v1h-1v-1h-1zM5 9h1v1h-1zM18 9h5v2h-2v-1h-3zM25 9h1v1h-1zM11 11h1v1h-1zM1 12h1v1h1v-1h1v2h-1v1h-2zM15 12v2h2v-2zM9 13h1v1h1v1h-1v1h1v1h-2zM3 15h2v1h-2zM6 15h2v1h-1v1h-1zM11 15h1v1h-1zM13 16h1v1h-1zM25 16h1v2h-1zM1 17h4v1h-4zM7 17h2v1h-2zM11 17h2v1h-1v1h1v-1h1v1h2v1h-1v2h2v1h-3v-1h-1v-1h1v-1h-1v1h-1v-1h-3v-2h1v1h1zM18 18v3h3v-3zM1 19h7v7h-7zM19 19h1v1h-1zM2 20v5h5v-5zM3 21h3v3h-3zM9 21h3v3h-1v1h2v1h-4v-1h1v-2h1v-1h-2zM13 24h1v1h-1zM15 24h2v2h-3v-1h1zM18 25h1v1h-1z\"/></svg>","theme":"structures"},{"_id":"56c33da898d4b001005e421d","title":"Exploring air pollution: Los Angeles air quality","presenter":"Ethan C. McGarrigle","pi":"Colette Heald","email":"ethanmcg@mit.edu","website":"web.mit.edu/heald/www/","keyword":["Air Quality","Los Angeles","Atomospheric Chemistry"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h1v3h-1zM13 1h1v1h-1zM15 1h1v1h-1zM17 1h1v1h-1zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM12 3h5v1h-2v1h-1v-1h-2zM21 3h3v3h-3zM17 4h1v5h1v1h-2zM9 5h2v2h-1v-1h-1zM12 5h2v1h-1v1h-1zM14 6h2v2h-1v-1h-1zM9 7h1v1h-1zM11 7h1v1h-1zM13 7h1v1h1v1h-2zM10 8h1v1h2v1h-1v1h-2v-1h-1v1h-1v-1h-1v1h1v1h-2v-2h-1v1h-2v-1h1v-1h6zM1 9h1v1h-1zM15 9h1v1h-1zM21 9h1v2h1v-2h3v1h-2v3h-1v-1h-2v2h-2v-1h-1v1h1v1h2v-1h1v-1h1v1h1v1h-1v1h1v-1h2v1h-1v1h-1v1h-1v1h-1v1h1v2h-3v1h-1v-1h-1v1h1v1h-3v-1h1v-1h-1v-2h1v-2h-2v1h-1v-1h-1v1h-2v-2h2v-1h1v1h4v-2h-1v1h-2v-1h1v-2h1v-1h-1v-2h1v1h1v1h1v-1h1v-1h1zM13 10h1v1h1v1h-1v1h-1v1h-1v-2h1zM1 11h2v1h-1v2h1v2h-1v2h-1zM25 11h1v3h-1zM3 12h3v3h-1v3h-1v-1h-1v-1h1v-3h-1zM8 12h3v2h-1v1h-1v-2h-1zM15 12h1v1h-1zM7 13h1v1h-1zM13 14h2v1h-2zM7 15h2v1h1v-1h2v1h-1v1h-1v2h1v2h-1v2h-1v-6h-1v-1h-1zM21 16v1h1v-1zM7 17h1v1h-1zM25 17h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM13 19h1v1h-1zM19 19h1v1h-1zM23 19h1v1h-1zM25 19h1v1h-1zM2 20v5h5v-5zM12 20h1v2h-1zM14 20h1v2h1v1h-1v3h-3v-1h-1v-1h1v-1h1v1h1v-1h-1v-1h1zM3 21h3v3h-3zM24 21h2v5h-1v-1h-3v-1h2zM10 23h1v1h-1zM21 23h1v1h-1zM9 25h2v1h-2zM17 25h1v1h-1zM21 25h1v1h-1z\"/></svg>","theme":"cities"},{"_id":"56c33daf98d4b001005e421e","title":"From real-time responsive travelers and vehicles to city-scale transportation optimization","presenter":"Carolina Osorio","pi":"","email":"osorioc@mit.edu","website":"cee.mit.edu/osorio","keyword":["Transportation","Networks","Multiscale","Optimization"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h3v1h-3zM13 1h1v4h-1v-1h-2v1h1v1h-1v1h-1v2h2v1h-2v1h1v1h-2v3h-1v-1h-1v-1h1v-1h-1v-1h2v-1h-2v-1h2v-5h1v-1h3zM15 1h3v5h-3v-1h2v-1h-2v-1h2v-1h-2zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM21 3h3v3h-3zM12 6h2v2h-1v-1h-1zM11 7h1v1h-1zM15 7h1v1h-1zM17 7h1v2h5v2h-2v-1h-3v1h-1v1h-1v-1h-2v1h-1v-1h-1v-1h1v-1h1v-1h1v2h2zM12 8h1v1h-1zM1 9h1v2h1v-1h1v2h-3zM5 9h1v1h1v1h-2zM25 9h1v1h-1zM20 11h1v3h-2v1h-2v1h-2v2h2v-2h1v1h2v-1h1v-2h2v-1h-1v-1h1v-1h1v2h2v1h-2v1h-1v1h-1v2h1v-2h1v4h2v3h-1v2h1v1h-5v-1h2v-6h-1v3h-1v1h-1v2h-1v-1h-1v-1h1v-1h-1v1h-2v-1h1v-3h-3v-1h-1v-1h1v-1h-1v1h-1v2h-1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h2v-1h1v2h-1v1h1v-1h1v1h2v-1h-2v-1h1v-1h1v1h1v1h1v-2h1v1h1zM4 12h3v1h-1v2h-1v1h-1v-2h1v-1h-1zM1 13h2v2h-2zM7 15h1v1h-1zM9 16h1v1h-1zM25 16h1v2h-1zM1 17h7v1h-7zM9 18h1v2h-1zM18 18v3h3v-3zM1 19h7v7h-7zM19 19h1v1h-1zM2 20v5h5v-5zM11 20h1v1h1v1h-1v1h1v-1h1v1h2v1h-1v2h-2v-1h1v-1h-1v1h-1v-1h-2v-2h1zM13 20h1v1h-1zM15 20h1v2h-2v-1h1zM3 21h3v3h-3zM9 21h1v1h-1zM24 21v1h1v-1zM16 24h1v2h-1zM9 25h1v1h-1zM18 25h1v1h-1z\"/></svg>","theme":"cities"},{"_id":"56c3c54798d4b001005e4222","title":"Why care about ecological networks","presenter":"Serguei Saavedra","pi":"","email":"sersaa@mit.edu","website":"sites.google.com/site/sergueisaavedra/","keyword":["Persistance","Perturbations","Structures"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 31 31\"><path d=\"M1 1h7v7h-7zM9 1h1v1h-1zM11 1h1v1h-1zM14 1h4v1h-2v2h-1v-1h-3v-1h2zM23 1h7v7h-7zM2 2v5h5v-5zM10 2h1v1h-1zM18 2h3v1h1v1h-1v1h-1v1h-1v-2h-2v-1h1zM24 2v5h5v-5zM3 3h3v3h-3zM25 3h3v3h-3zM9 4h1v1h1v-1h1v1h2v3h-1v-1h-1v-1h-2v4h-1v2h-2v1h-1v-2h2v-1h-1v-1h2zM14 4h1v1h-1zM16 4h1v1h1v1h-3v-1h1zM21 5h1v1h-1zM20 6h1v1h-1zM11 7h1v1h-1zM15 7h1v1h1v1h-1v1h2v1h-1v2h-1v-1h-1v2h3v2h-2v-1h-2v-1h-1v-3h-2v6h-2v-1h-3v-1h-1v-1h2v1h1v-1h-1v-1h2v1h1v-1h-1v-1h1v-2h2v-2h1v2h1v1h1v-1h-1v-1h1zM17 7h1v1h-1zM19 7h1v2h-1v1h-1v-2h1zM21 7h1v2h5v1h-1v1h-1v-1h-1v1h-1v-1h-3v-1h1zM1 9h1v1h3v-1h1v2h-1v2h-1v1h-2v-1h1v-1h1v-1h-2v2h-1zM29 9h1v4h-1v1h1v6h-1v-5h-1v1h-2v-1h-1v1h-4v-1h2v-1h5v-2h1zM27 10h1v1h-1zM26 11h1v2h-1zM18 12h1v2h-1zM21 12h2v2h-1v-1h-1zM20 13h1v1h-1zM12 14h1v1h-1zM19 14h1v3h-1v1h-1v1h-1v1h1v-1h2v1h1v1h5v-1h1v2h-1v1h1v-1h3v2h-1v-1h-1v1h-1v2h-4v2h-1v1h1v1h-3v-1h1v-1h-1v-1h2v-1h-2v-1h-1v1h1v1h-1v1h1v1h-1v1h-2v-2h1v-1h-1v1h-2v-1h1v-1h2v-1h-2v1h-1v1h-1v-1h-1v-1h-1v1h-1v-2h3v1h1v-1h1v-1h-2v-1h-1v-1h1v-1h-1v-2h1v1h2v-1h1v-1h1v-1h1zM4 15h1v1h-1zM2 16h2v1h-2zM13 16h1v1h-1zM15 16h1v2h-2v-1h1zM25 16h1v1h-1zM1 17h1v2h-1zM4 17h1v1h-1zM6 17h3v1h-2v1h1v1h-2zM11 17h2v1h-1v2h-1v-1h-1v-1h1zM21 17h2v1h-2zM26 17h1v1h-1zM3 18h1v1h-1zM23 18h3v2h-1v-1h-2zM21 19h1v1h-1zM27 19h1v1h-1zM3 20h1v1h-1zM9 20h1v1h-1zM15 20v2h3v1h-1v1h1v-1h1v-1h1v1h1v-1h-1v-1h-1v1h-1v-1h-2v-1zM1 21h2v1h-2zM4 21h1v1h-1zM6 21h3v1h-3zM10 21h1v1h-1zM9 22h1v2h-1zM11 22h2v1h-2zM22 22v3h3v-3zM1 23h7v7h-7zM23 23h1v1h-1zM2 24v5h5v-5zM28 24h1v2h-1zM3 25h3v3h-3zM9 25h1v1h-1zM10 26h1v1h-1zM12 26h1v1h1v1h1v1h1v1h-2v-1h-2v1h-1v-2h1zM29 26h1v3h-1v1h-1v-2h-1v2h-1v-1h-1v-1h1v-1h3zM9 29h1v1h-1zM24 29h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c3c70398d4b001005e4223","title":"Microbial communities as multi-scale systems","presenter":"Otto Cordero","pi":"","email":"ottox@mit.edu","website":"www.corderolab.org","keyword":["Multiscale","Microbial Collectives","Evolutionary Dynamics"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM11 1h1v1h-1zM17 1h1v1h-1zM19 1h7v7h-7zM2 2v5h5v-5zM12 2h1v2h1v1h1v1h2v-1h-1v-1h2v5h-1v-2h-1v1h-1v-1h-1v-1h-1v-1h-1v1h-1v-1h-1v1h1v1h-1v2h-1v-6h2v1h1zM14 2h3v1h-1v1h-1v-1h-1zM20 2v5h5v-5zM3 3h3v3h-3zM21 3h3v3h-3zM11 7h1v1h-1zM13 7h1v1h1v1h-2zM1 9h1v1h-1zM3 9h5v1h-1v1h1v1h-1v1h-1v-1h-1v2h-2v-1h-2v-1h1v-2h1v2h1v-2h-1zM11 9h2v2h-1v-1h-1zM15 9h1v1h-1zM19 9h5v1h-3v3h-1v-1h-1v-1h1v-1h-1zM5 10v1h1v-1zM9 10h2v1h-1v2h-2v-1h1zM17 10h2v1h-2zM24 10h1v1h1v1h-1v1h1v1h-1v1h1v1h-1v1h1v1h-1v1h1v1h-3v-1h1v-1h-1v1h-1v2h2v1h1v-1h1v5h-3v-1h2v-2h-1v1h-1v-2h-1v1h-1v-1h-1v1h-2v-1h-2v-1h1v-2h-1v-1h-1v-1h3v-2h1v2h1v-1h1v1h3v-1h-2v-1h1v-1h-2v-1h1v-1h1v1h1v-1h-1v-1h1zM13 11h1v2h-1v1h-2v1h1v1h-1v1h-1v-1h-1v-1h1v-2h1v-1h2zM16 11h1v1h-1zM15 12h1v1h-1zM17 12h1v1h-1zM7 13h1v1h-1zM18 13h2v1h-2zM1 14h1v4h-1zM6 14h1v1h1v1h-1v1h1v1h-4v-1h-1v-2h3zM13 14h3v1h1v1h-2v1h-1v1h-1v-2h1v-1h-1zM20 14h1v1h-1zM9 17h1v1h1v1h-2zM11 17h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM12 19h2v1h-1v2h-3v1h2v1h-1v1h-1v-1h-1v-4h1v1h2zM19 19h1v1h-1zM2 20v5h5v-5zM15 20h1v1h-1zM3 21h3v3h-3zM13 22h3v1h1v1h2v1h-3v-1h-1v1h-1v1h-1v-2h1v-1h-1zM20 23h1v1h-1zM21 24h1v1h-1zM9 25h1v1h-1zM15 25h1v1h-1zM19 25h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c3c78f98d4b001005e4224","title":"How microbial communities evolve","presenter":"Gabriel Leventhal","pi":"Otto Cordero","email":"gaberoo@mit.edu","website":"www.corderolab.org","keyword":["Microbial Collectives","Networks","Evolution"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM11 1h1v1h-1zM17 1h1v1h-1zM19 1h7v7h-7zM2 2v5h5v-5zM12 2h1v2h1v1h1v1h2v-1h-1v-1h2v5h-1v-2h-1v1h-1v-1h-1v-1h-1v-1h-1v1h-1v-1h-1v1h1v1h-1v2h-1v-6h2v1h1zM14 2h3v1h-1v1h-1v-1h-1zM20 2v5h5v-5zM3 3h3v3h-3zM21 3h3v3h-3zM11 7h1v1h-1zM13 7h1v1h1v1h-2zM1 9h1v1h-1zM3 9h5v1h-1v1h1v1h-1v1h-1v-1h-1v2h-2v-1h-2v-1h1v-2h1v2h1v-2h-1zM11 9h2v2h-1v-1h-1zM15 9h1v1h-1zM19 9h5v1h-3v3h-1v-1h-1v-1h1v-1h-1zM5 10v1h1v-1zM9 10h2v1h-1v2h-2v-1h1zM17 10h2v1h-2zM24 10h1v1h1v1h-1v1h1v1h-1v1h1v1h-1v1h1v1h-1v1h1v1h-3v-1h1v-1h-1v1h-1v2h2v1h1v-1h1v5h-3v-1h2v-2h-1v1h-1v-2h-1v1h-1v-1h-1v1h-2v-1h-2v-1h1v-2h-1v-1h-1v-1h3v-2h1v2h1v-1h1v1h3v-1h-2v-1h1v-1h-2v-1h1v-1h1v1h1v-1h-1v-1h1zM13 11h1v2h-1v1h-2v1h1v1h-1v1h-1v-1h-1v-1h1v-2h1v-1h2zM16 11h1v1h-1zM15 12h1v1h-1zM17 12h1v1h-1zM7 13h1v1h-1zM18 13h2v1h-2zM1 14h1v4h-1zM6 14h1v1h1v1h-1v1h1v1h-4v-1h-1v-2h3zM13 14h3v1h1v1h-2v1h-1v1h-1v-2h1v-1h-1zM20 14h1v1h-1zM9 17h1v1h1v1h-2zM11 17h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM12 19h2v1h-1v2h-3v1h2v1h-1v1h-1v-1h-1v-4h1v1h2zM19 19h1v1h-1zM2 20v5h5v-5zM15 20h1v1h-1zM3 21h3v3h-3zM13 22h3v1h1v1h2v1h-3v-1h-1v1h-1v1h-1v-2h1v-1h-1zM20 23h1v1h-1zM21 24h1v1h-1zM9 25h1v1h-1zM15 25h1v1h-1zM19 25h1v1h-1z\"/></svg>","theme":"ecology"},{"_id":"56c3cd7698d4b001005e4225","title":"System characterization","presenter":"John Williams","pi":"","email":"jrw@mit.edu","website":"geonumerics.mit.edu","keyword":["Systems","Computation","Data"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM10 1h1v1h1v3h-1v-2h-1zM12 1h2v1h-2zM17 1h1v3h-1v1h-1v1h1v1h-1v2h-1v-4h-1v-1h2v-1h-1v-1h2zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM9 3h1v3h1v1h-1v1h1v1h1v-1h1v-1h-1v-2h1v1h1v3h-1v1h-1v1h-2v-2h-1zM13 3h1v1h-1zM21 3h3v3h-3zM17 5h1v1h-1zM11 7h1v1h-1zM17 7h1v2h-1zM1 9h1v1h-1zM3 9h5v1h-1v1h-2v2h-1v-2h-1zM19 9h5v2h2v3h-2v1h2v1h-1v1h1v1h-3v-1h1v-1h-3v-1h2v-1h-2v-2h1v1h2v-1h-1v-2h-2v2h-2v-1h1v-1h-1zM13 10h2v1h2v1h2v1h1v1h-1v1h-1v1h-1v1h-2v-1h1v-1h1v-1h-2v-1h1v-1h-1v1h-1v1h-1v-2h1v-1h-1zM2 11h1v3h-1v4h-1v-5h1zM7 11h1v1h-1zM9 11h1v1h2v2h-2v-1h-1v1h1v1h-2v-1h-1v-1h1v-1h1zM12 11h1v1h-1zM6 12h1v1h-1zM5 13h1v1h1v1h-1v3h-1v-1h-1v-1h1zM20 14h1v1h-1zM7 15h1v1h-1zM10 15h1v1h1v-1h2v1h-1v2h-1v-1h-1v1h-1v1h-1v-1h-2v-1h1v-1h2zM19 15h1v1h-1zM18 16h1v1h3v4h2v1h1v-1h1v5h-4v-1h3v-2h-2v-1h-1v1h-1v3h-1v-3h-1v-1h-4v-1h2v-2h-1v1h-1v1h-1v1h-1v-2h1v-1h-1v-1h4v-1h1zM3 17h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM11 19h1v4h-1v1h-2v-4h2zM19 19h1v1h-1zM24 19h2v1h-1v1h-1zM2 20v5h5v-5zM3 21h3v3h-3zM10 21v1h1v-1zM12 23h2v1h-1v2h-2v-2h1zM17 23h1v1h1v1h-4v-1h2zM9 25h1v1h-1z\"/></svg>","theme":"resources"},{"_id":"56c3ce1398d4b001005e4226","title":"Ultrasonic spraying of silk suspension for fruit preservation","presenter":"Ann M. Hughes","pi":"Benedetto Marelli","email":"amhughes@mit.edu","website":"cee.mit.edu/marelli","keyword":["Fruit Preservation","Silk","Ultrasonic Spray"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h2v1h-2zM13 1h1v1h1v1h-1v1h2v1h1v-1h1v4h-1v-2h-1v2h1v1h-1v1h2v2h1v1h1v-2h1v3h-2v1h-2v1h1v1h2v-1h1v-2h2v-1h-1v-1h1v-1h1v2h2v1h-2v1h-1v1h-1v2h1v-2h1v6h1v-2h1v3h-1v2h1v1h-5v-1h2v-6h-1v3h-1v1h-1v2h-1v-1h-1v-1h1v-1h-2v-5h-1v1h-2v-1h1v-1h1v-1h-2v-1h-1v-1h1v-2h1v-1h-3v-1h3v-2h-1v-1h1v-1h-2v1h-1v-2h1zM15 1h3v1h-3zM19 1h7v7h-7zM2 2v5h5v-5zM11 2h1v2h-1zM20 2v5h5v-5zM3 3h3v3h-3zM16 3h1v1h-1zM21 3h3v3h-3zM9 4h2v1h-1v1h2v2h-1v-1h-1v1h1v3h-2v1h-2v1h1v1h-3v-3h3v-1h-1v-1h2zM13 7h1v1h-1zM1 9h1v1h3v1h-2v1h-1v-1h-1zM5 9h1v1h-1zM18 9h5v2h-2v-1h-3zM25 9h1v1h-1zM11 11h1v1h-1zM1 12h1v1h1v-1h1v2h-1v1h-2zM15 12v2h2v-2zM9 13h1v1h1v1h-1v1h1v1h-2zM3 15h2v1h-2zM6 15h2v1h-1v1h-1zM11 15h1v1h-1zM13 16h1v1h-1zM25 16h1v2h-1zM1 17h4v1h-4zM7 17h2v1h-2zM11 17h2v1h-1v1h1v-1h1v1h2v1h-1v2h2v1h-3v-1h-1v-1h1v-1h-1v1h-1v-1h-3v-2h1v1h1zM18 18v3h3v-3zM1 19h7v7h-7zM19 19h1v1h-1zM2 20v5h5v-5zM3 21h3v3h-3zM9 21h3v3h-1v1h2v1h-4v-1h1v-2h1v-1h-2zM13 24h1v1h-1zM15 24h2v2h-3v-1h1zM18 25h1v1h-1z\"/></svg>","theme":"resources"},{"_id":"56c3d23598d4b001005e4227","title":"Geometric stability and the shaping of the Collier Memorial","presenter":"Corentin Fivet","pi":"John Ochsendorf","email":"corentin@mit.edu","website":"cee.mit.edu/fivet","keyword":["Form-finding","Masonry","Construction"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM11 1h1v2h-1zM13 1h2v1h1v-1h1v2h1v6h-1v1h-1v-1h-1v-2h1v1h1v-1h-1v-1h1v-1h-2v-1h1v-1h-1v1h-1v4h-1v-2h-1v2h-1v-3h-1v4h-1v-6h2v1h1v1h1zM19 1h7v7h-7zM2 2v5h5v-5zM20 2v5h5v-5zM3 3h3v3h-3zM21 3h3v3h-3zM12 8h1v1h1v1h2v1h1v1h-2v1h-1v-2h-1v-1h-1v2h-2v2h-1v2h2v-1h-1v-1h1v-1h1v2h2v1h-1v2h-1v-1h-1v1h-1v-1h-2v-1h-3v-1h1v-2h-2v-1h1v-1h1v1h1v1h1v-1h1v-1h2v-1h-1v-1h2zM1 9h1v2h1v-2h5v1h-4v2h-2v1h2v1h-2v4h-1zM19 9h5v1h-3v3h-1v1h-1v1h1v1h1v-1h2v-1h-2v-1h1v-1h1v1h1v-2h2v3h-2v1h2v1h-1v1h-1v-1h-2v1h2v2h-1v-1h-1v3h2v1h1v-1h-1v-2h2v7h-3v-1h2v-2h-4v-1h-1v1h-1v-1h-1v1h-2v-1h-1v-1h2v-2h-1v1h-1v1h-1v1h-1v-2h1v-1h-1v-1h4v-1h1v-1h-1v1h-2v-1h1v-1h1v-1h-2v-1h2v-1h1v1h1v-1h-1v-1h2v-1h-1zM17 10h1v1h-1zM7 11h1v1h-1zM12 12h1v1h-1zM13 13h1v1h-1zM4 14h1v1h-1zM7 14v1h1v-1zM20 14h1v1h-1zM4 16h1v1h1v1h-3v-1h1zM7 17h1v1h-1zM25 17h1v1h-1zM9 18h1v1h-1zM18 18v3h3v-3zM1 19h7v7h-7zM11 19h1v1h-1zM19 19h1v1h-1zM2 20v5h5v-5zM9 20h2v2h-1v2h-1zM3 21h3v3h-3zM11 23h3v1h-1v2h-4v-1h1v-1h1zM15 24h4v2h-1v-1h-3zM20 25h1v1h-1z\"/></svg>","theme":"structures"},{"_id":"56c3d28898d4b001005e4228","title":"Tough, adhesive, smart water","presenter":"Xuanhe Zhao","pi":"","email":"zhaox@mit.edu","website":"zhaox.org","keyword":["Network","Food","Water"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 23 23\"><path d=\"M1 1h7v7h-7zM10 1h1v1h-1zM12 1h2v1h-1v1h-1zM15 1h7v7h-7zM2 2v5h5v-5zM16 2v5h5v-5zM3 3h3v3h-3zM9 3h3v1h1v1h-2v-1h-1v1h1v1h-1v3h-1zM17 3h3v3h-3zM13 5h1v1h-1zM11 6h2v1h-1v1h-1zM13 7h1v1h-1zM1 9h1v1h1v1h-1v3h-1zM3 9h5v1h-1v1h1v1h-1v1h2v1h-4v-1h-1v-1h2v-2h-1v1h-1v-1h-1zM10 9h1v1h-1zM12 9h1v1h1v2h1v1h-1v1h1v1h1v1h-2v-1h-1v-2h-1v-1h1v-1h-1zM15 9h5v1h-2v1h-1v-1h-2zM21 10h1v1h-1zM10 11h2v1h-1v2h-1v-1h-1v-1h1zM15 11h1v1h-1zM19 11h2v1h-1v1h-2v2h-2v-1h1v-2h2zM21 12h1v3h-1v2h-3v1h1v2h1v1h-1v1h-3v-1h-2v1h-1v-1h-1v-1h1v-1h-1v1h-1v-2h1v-1h1v1h4v-1h-1v-1h2v-1h1v-1h2zM3 13h1v1h-1zM15 13h1v1h-1zM9 14h1v1h-1zM11 14h1v1h1v1h-1v1h-2v3h-1v-4h1v-1h1zM1 15h7v7h-7zM2 16v5h5v-5zM3 17h3v3h-3zM21 17h1v1h-1zM14 19v1h1v-1zM17 19v2h1v-2zM10 20h1v1h-1zM9 21h1v1h-1zM11 21h1v1h-1zM20 21h1v1h-1z\"/></svg>","theme":"structures"},{"_id":"56c3d2f198d4b001005e4229","title":"Antiqua-inspired materials","presenter":"Admir Masic","pi":"","email":"masic@mit.edu","website":"cee.mit.edu/node/24782","keyword":["Ancient Materials","Multiscale","Characterization"],"qrcode":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 27 27\"><path d=\"M1 1h7v7h-7zM9 1h3v5h1v-1h1v3h-1v-1h-1v1h-1v-1h-1v-1h1v-1h-1v-1h-1zM13 1h2v1h-1v1h1v1h3v1h-4v-1h-1zM17 1h1v2h-1zM19 1h7v7h-7zM2 2v5h5v-5zM10 2v1h1v-1zM15 2h1v1h-1zM20 2v5h5v-5zM3 3h3v3h-3zM21 3h3v3h-3zM9 5h1v1h-1zM15 6h1v3h-2v-1h1zM9 7h1v1h-1zM17 7h1v2h1v1h-2v2h-1v-3h1zM10 8h1v1h1v1h-1v1h1v1h-1v2h-1v-1h-1v-1h1v-1h-2v-1h-2v3h-1v-1h-2v-1h2v-1h-1v-1h6zM12 8h1v1h-1zM1 9h1v1h1v1h-1v2h-1zM21 9h1v1h1v-1h3v1h-2v1h-2v1h-1v2h-2v-1h-1v-1h1v-1h1v-1h1zM7 11h1v1h-1zM13 11h2v1h-1v1h-1zM25 11h1v3h-1zM15 12h1v1h2v1h1v1h2v-1h1v-1h1v1h1v1h-1v1h1v-1h2v1h-1v1h1v1h-1v1h-1v-1h-1v1h-1v1h1v2h-3v1h-1v-1h-3v-1h-1v1h1v1h-1v3h-4v-1h-1v-1h1v-1h-2v-6h4v-1h1v1h1v-1h1v-2h-1zM23 12h1v1h-1zM3 13h1v1h-1zM7 13h1v1h-1zM12 13h1v1h-1zM1 14h2v2h-1v2h-1zM4 14h1v2h1v-2h1v1h1v1h-1v1h1v1h-2v-1h-2zM8 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM9 15h1v1h-1zM14 15h1v1h-1zM17 15v2h-1v3h1v-3h1v-2zM21 16v1h1v-1zM10 18v2h1v1h-1v1h1v-1h1v-1h1v2h-1v1h1v1h1v-1h-1v-1h1v-2h1v-2h-2v1h-2v-1zM18 18v3h3v-3zM1 19h7v7h-7zM13 19h1v1h-1zM19 19h1v1h-1zM23 19h1v1h-1zM25 19h1v1h-1zM2 20v5h5v-5zM3 21h3v3h-3zM24 21h2v5h-1v-1h-3v-1h2zM17 23h2v1h-2zM21 23h1v1h-1zM9 25h1v1h-1zM17 25h1v1h-1zM21 25h1v1h-1z\"/></svg>","theme":"structures"}];
	var collection = db.get('talks');
	for(var i = 0; i<restore_data.length; i++)
	{
		collection.insert(restore_data[i]);
	}
	res.send("restoring...");
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);