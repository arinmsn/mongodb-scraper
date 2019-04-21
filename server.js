var express = require("express");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");

var PORT = process.env.PORT || 8000;
var app = express();

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");


// Routes

// Load index page
app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      var dbArticleRev = dbArticle.reverse();
      var hbsObject = {
        article: dbArticleRev 
      }
      /* console.log(hbsObject); */
      res.render("index", hbsObject);
    })
});

// A GET route for scraping the WaPo website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.economist.com/finance-and-economics/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every "class='headline'"" within a div tag, and do the following:
    $("article").each(function(i, element) {
      // Save an empty result object
      var result = {};

    result.title = $(element).find('span.flytitle-and-title__title').text();
    articleURL = $(element).find(".teaser__link").attr("href");
    result.link = "https://www.economist.com" + articleURL;
    img = $(element).find("a").parent().find("img").attr("src");
    result.description = $(element).find(".teaser__text").text();
    
    if (img) {
      result.img = img;
    }
    else {
      result.img = $("div.component-image__img").find("img").attr("src");
    }
        // Searching through the database
        db.Article.findOne({title:result.title},function(err,data){
          if (!data)
          {
              var entry = new db.Article(result);
                    // Saving to database
                    entry.save(function(err, data) {
                      if (err) {
                        console.log(err);
                      }
                      else {
                        console.log("saving article, title: "+ data.title);
                        console.log("Link:  " + data.link);
                        console.log("Descriptoin:  " + data.description);
                        console.log("Image link: " + data.img)
                      }
                    });
          }
          else
          {
              console.log("This article is already in database: "+ data.title);
          }
      });
    });
    res.redirect("/");
  });
});


// Retrieve all articles
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/saved", function(req, res) {
  db.Article.find({saved: true})
    .then(function(dbArticle) {
      var dbArticleRev = dbArticle.reverse();
      var hbsObject = {
        article: dbArticleRev 
      }
      res.render("index", hbsObject);
    })
});

// Saving an article
app.put("/saved/:id", function(req, res) {
  console.log(req.params.id);
  db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { saved: true }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Retrieivng aritcle using its id
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to find the article..
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Saving & updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      // Update the Article to be attach it to the new 'Note'
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Deleting article from database
app.delete("/delete/:id", function(req, res) {

  db.Article.deleteOne({_id: req.params.id}, function(err){})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    }); 
});

app.listen(PORT, function() {
  console.log("App is up and running on " + PORT);
});
