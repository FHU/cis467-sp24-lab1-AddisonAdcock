const express = require("express");

const app = express();
const PORT = 3000;
const mysql = require("mysql2/promise");
const config = require("./config");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool(config.db);

app.listen(PORT, async () => {
  const host = process.env.HOSTNAME || "http://localhost";
  console.log(`Listening on ${host}:${PORT}`);
});

app.use((req, res, next) => {
  req.user = { id: 4, name: "Kenan" }
  next()
});

app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    console.log(req.user);
    const [users] = await conn.query("SELECT * FROM users");

    conn.release();
    //console.log(users)

    res.json(users);
  } catch (err) {
    res.json({ message: "error" });
    console.error(err);
  }
});

app.get("/tags", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    console.log(req.user);
    const [tags] = await conn.query("SELECT * FROM tags");

    conn.release();
    //console.log(users)

    res.json(tags);
  } catch (err) {
    res.json({ message: "error" });
    console.error(err);
  }
});

app.get("/tags/:id", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    console.log(req.user);
    const [tags] = await conn.query(
      "SELECT * FROM tags WHERE tagID=" + req.params.id
    );

    conn.release();
    //console.log(users)

    if (tags.length > 0) {
      res.json(tags[0]);
    } else {
      res.status(404).json({ message: "Resource not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "error" });
    console.error(err);
  }
});

app.put("/tags/:id", async (req, res) => {
  const { tagDescription } = req.body;
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [existingTag] = await connection.query("SELECT * FROM tags WHERE tagID=?", [id]);
    if (existingTag.length === 0) {
      res.status(404).send("Tag not found");
      return;
    }
    await connection.query("UPDATE tags SET tagDescription=? WHERE tagID=?", [tagDescription, id]);
    const [updatedTag] = await connection.query("SELECT * FROM tags WHERE tagID=?", [id]);
    connection.release();
    res.status(200).json(updatedTag[0]);
  } catch (err) {
    console.error("Error updating tag:", err);
    res.status(500).send("Error updating tag");
  }
});


app.delete("/tags/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [existingTag] = await connection.query("SELECT * FROM tags WHERE tagID=?", [id]);
    if (existingTag.length === 0) {
      res.status(404).send("Tag not found");
      return;
    }
    await connection.query("DELETE FROM prayerstags WHERE tagID=?", [id]);
    await connection.query("DELETE FROM tags WHERE tagID=?", [id]);
    connection.release();
    res.status(200).send("Tag deleted successfully");
  } catch (err) {
    console.error("Error deleting tag:", err.message);
    res.status(500).send("Error deleting tag");
  }
});


// Create a new user
app.post("/tags", async (req, res) => {
  const { tagDescription } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query("INSERT INTO tags (tagDescription) VALUES (?)", [
      tagDescription,
    ]);
    const [newTag] = await connection.query(
      "SELECT * FROM tags WHERE tagDescription=?",
      [tagDescription]
    );
    connection.release();
    res.status(201).json(newTag[0]);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).send("Error creating user");
  }
});
