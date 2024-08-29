import bodyParser from "body-parser"; 
import express from "express";
import pg from "pg";
import moment from "moment";

const app = express();
const port = 3000;

const db = new pg.Client({
  user : 'postgres',
  database : 'toDo',
  host : 'localhost',
  password : '1234',
  port : 5432
});

db.connect();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

let items = [];

let users = [];

let currentUserId = 1;

async function choosenOne() {
  const result = await db.query("SELECT * FROM items WHERE user_id = ($1) ORDER BY id ASC", [currentUserId]);
  return result.rows;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users WHERE id = ($1)", [currentUserId]);
  return result.rows[0];
  // return users.find((user) => user.id === currentUserId);
}

//to get data
app.get("/", async(req,res) => {
  try{
    const items = await choosenOne();
    const currentUser = await getCurrentUser();
    res.render("index.ejs",{
    listItems: items,
    listTitle: "Today",
    users: await db.query("SELECT * FROM users"),
  });
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


//to add data
app.post("/add", async(req,res) => {
  const item = req.body.newItem;
  const completionDate = req.body.completionDate || null;
  try{
    await db.query("INSERT INTO items(title , user_id, completion_date) VALUES ($1 , $2, $3)",[item, currentUserId, completionDate]);
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


//to delete data 
app.post("/delete", async(req, res) => {
  const item = req.body.deleteItemId;
  try{
    const result = await db.query("DELETE FROM items WHERE id = ($1) AND user_id = ($2)",[item, currentUserId]);
    if (result.rowCount === 0) {
      console.log("No item found to delete");
    }
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


//to edit data
app.post("/edit", async(req,res) => {
  const id = req.body.updatedItemId;
  const title = req.body.updatedItemTitle;
  const completionDate = req.body.updateCompletionDate || null;
  

  const formattedDate = completionDate ? moment(completionDate).format('YYYY-MM-DD'): null ;
  try{
    await db.query("UPDATE items SET title = ($1) , completion_date = ($2) WHERE id = ($3) AND user_id = ($4)",[title ,formattedDate ,id, currentUserId]);
    
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


//to add current user data
app.post("/user", async(req,res) => {
  if(req.body.add === "new"){
    res.render("new.ejs");
  }
  else{
    currentUserId = parseInt(req.body.user);
    res.redirect("/");
  }
});


//to add new user 
app.post("/new", async(req,res) => {
  const name = req.body.name;
  try{
  const result = await db.query("INSERT INTO users (name) VALUES ($1) RETURNING *",[name]);
  currentUserId = result.rows[0].id;
  res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});