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


//Get All Prayers
app.get("/prayers", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [prayers] = await connection.query("SELECT * FROM prayers");
    connection.release();
    res.status(200).json(prayers);
  } catch (err) {
    console.error("Error fetching prayers:", err.message);
    res.status(500).send("Error fetching prayers");
  }
});

//Get Prayer by ID
app.get("/prayers/:id", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [prayers] = await connection.query("SELECT * FROM prayers WHERE prayerID = ?", [req.params.id]);
    connection.release();

    if (prayers.length === 0) {
      res.status(404).send("Prayer not found");
    } else {
      res.status(200).json(prayers[0]);
    }
  } catch (err) {
    console.error("Error fetching prayer:", err.message);
    res.status(500).send("Error fetching prayer");
  }
});

//Delete Prayer By ID
app.delete("/prayers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [existingPrayer] = await connection.query("SELECT * FROM prayers WHERE prayerID=?", [id]);
    if (existingPrayer.length === 0) {
      res.status(404).send("Prayer not found");
      return;
    }
    await connection.query("DELETE FROM likes WHERE prayerID=?", [id]);
    await connection.query("DELETE FROM prayerscreators WHERE prayerID=?", [id]);
    await connection.query("DELETE FROM prayersscriptures WHERE prayerID=?", [id]);
    await connection.query("DELETE FROM prayerstags WHERE prayerID=?", [id]);
    await connection.query("DELETE FROM prayers WHERE prayerID=?", [id]);
    connection.release();
    res.status(200).send("Prayer deleted successfully");
  } catch (err) {
    console.error("Error deleting prayer:", err.message);
    res.status(500).send("Error deleting prayer");
  }
});

//Post A Prayer
app.post("/prayers", async (req, res) => {
  const { body, prompt } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.query("INSERT INTO prayers (body, prompt) VALUES (?, ?)", [
      body, prompt
    ]);
    const [newPrayer] = await connection.query(
      "SELECT * FROM prayers WHERE body=? AND prompt=?", [body, prompt]
    );
    connection.release();
    res.status(201).json(newPrayer[0]);
  } catch (err) {
    console.error("Error creating prayer:", err);
    res.status(500).send("Error creating prayer");
  }
});

//Update A Prayer
app.put("/prayers/:id", async (req, res) => {
  const { body, prompt } = req.body;
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    await connection.query("UPDATE prayers SET body = ?, prompt = ? WHERE prayerID = ?", [
      body, prompt, id
    ]);
    const [updatedPrayer] = await connection.query(
      "SELECT * FROM prayers WHERE prayerID = ?", [id]
    );
    connection.release();
    res.status(200).json(updatedPrayer[0]);
  } catch (err) {
    console.error("Error updating prayer:", err);
    res.status(500).send("Error updating prayer");
  }
});

//Likes Get
app.get("/prayers/:id/likes", async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [likes] = await connection.query(
      "SELECT * FROM likes WHERE prayerID = ?", [id]
    );
    connection.release();
    res.status(200).json(likes);
  } catch (err) {
    console.error("Error getting likes:", err);
    res.status(500).send("Error getting likes");
  }
});

//Likes Post
app.post("/prayers/:id/likes", async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  try {
    const connection = await pool.getConnection();
    const [existingPrayer] = await connection.query("SELECT * FROM prayers WHERE prayerID=?", [id]);
    connection.release();
    if (existingPrayer.length === 0) {
      res.status(404).send("Prayer not found");
      return;
    }
    const [existingLike] = await pool.query("SELECT * FROM likes WHERE userID=? AND prayerID=?", [user.id, id]);
    if (existingLike.length > 0) {
      res.status(409).send("Like already exists");
      return;
    }
    await pool.query("INSERT INTO likes (userID, prayerID, likedTime) VALUES (?, ?, NOW())", [user.id, id]);
    res.status(201).send("Like added successfully");
  } catch (err) {
    console.error("Error liking prayer:", err.message);
    res.status(500).send("Error liking prayer");
  }
});

//Unlikes Post
app.delete("/prayers/:id/likes", async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  try {
    const [existingPrayer] = await pool.query("SELECT * FROM prayers WHERE prayerID=?", [id]);
    if (existingPrayer.length === 0) {
      res.status(404).send("Prayer not found");
      return;
    }
    const [existingLike] = await pool.query("SELECT * FROM likes WHERE userID=? AND prayerID=?", [user.id, id]);
    if (existingLike.length === 0) {
      res.status(404).send("Like not found");
      return;
    }
    await pool.query("DELETE FROM likes WHERE userID=? AND prayerID=?", [user.id, id]);
    res.status(200).send("Like successfully deleted");
  } catch (err) {
    console.error("Error unliking prayer:", err.message);
    res.status(500).send("Error unliking prayer");
  }
});

// Saves Post
app.post("/prayers/:id/saves", async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  try {
    const connection = await pool.getConnection();
    const [existingPrayer] = await connection.query("SELECT * FROM prayers WHERE prayerID=?", [id]);
    connection.release();
    if (existingPrayer.length === 0) {
      res.status(404).send("Prayer not found");
      return;
    }
    const [existingSave] = await pool.query("SELECT * FROM saves WHERE userID=? AND prayerID=?", [user.id, id]);
    if (existingSave.length > 0) {
      res.status(409).send("Prayer already saved");
      return;
    }
    await pool.query("INSERT INTO saves (userID, prayerID, savedTime) VALUES (?, ?, NOW())", [user.id, id]);
    res.status(201).send("Prayer saved successfully");
  } catch (err) {
    console.error("Error saving prayer:", err.message);
    res.status(500).send("Error saving prayer");
  }
});

// Unsave Post
app.delete("/prayers/:id/saves", async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  try {
    const [existingPrayer] = await pool.query("SELECT * FROM prayers WHERE prayerID=?", [id]);
    if (existingPrayer.length === 0) {
      res.status(404).send("Prayer not found");
      return;
    }
    const [existingSave] = await pool.query("SELECT * FROM saves WHERE userID=? AND prayerID=?", [user.id, id]);
    if (existingSave.length === 0) {
      res.status(404).send("Prayer not saved");
      return;
    }
    await pool.query("DELETE FROM saves WHERE userID=? AND prayerID=?", [user.id, id]);
    res.status(200).send("Prayer successfully unsaved");
  } catch (err) {
    console.error("Error unsaving prayer:", err.message);
    res.status(500).send("Error unsaving prayer");
  }
});

//Get All Saves
app.get("/prayers/:id/saves", async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [saves] = await connection.query(
      "SELECT * FROM saves WHERE prayerID = ?", [id]
    );
    connection.release();
    res.status(200).json(saves);
  } catch (err) {
    console.error("Error getting saves:", err);
    res.status(500).send("Error getting saves");
  }
});
