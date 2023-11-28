const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server running at http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
    `;
  const user = await db.get(selectUserQuery);
  if (user !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length >= 5) {
      const createUserQuery = `
        INSERT INTO
            user(username, name, password, gender, location)
        VALUES
        (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );
      `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUerQuery = `
    SELECT * FROM user WHERE username = '${username}';
  `;
  const dbUser = await db.get(selectUerQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
  `;
  const dbUser = await db.get(selectUserQuery);
  const passwordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (passwordMatched !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `
        UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';
        `;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
  console.log(passwordMatched);
});

module.exports = app;
