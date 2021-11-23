//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://rikkibobby:kukimuki@cluster0.c1yqo.mongodb.net/todolistDB");
//creating Schema
const itemSchema = new mongoose.Schema({
  name: String
});
//creating model
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  name: "Welcome to your to do list."
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});
const List = mongoose.model("List", listSchema);
// setTimeout(() => {mongoose.connection.close()}, 3000);
app.get("/", function(req, res) {
  Item.find(function(err, foundItems) {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Items added");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});
//creating routes by capturing route parameters
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  //access to kistTitle by adding a  value to the button see list.ejs 19
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(!err) {
        console.log("Successfully removed item");
        res.redirect("/");
      }
    });
  } else {
    //find what  update(pull/remove), pull what
    List.findOneAndUpdate({name: listName}, {$pull: {items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }
});
// app.get("/work", function(req, res) {
//   res.render("list", {listTitle: "Work List",newListItems: workItems});
// });
app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
