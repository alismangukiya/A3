const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 80;

// Configure the MySQL database connection
const connection = mysql.createConnection({
    host: "a3-database-instance-1.couyu5nfg2be.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "admin123",
    database: "mydb",
  });
// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database');

  // Create the products table if it does not exist
  const createTableSQL = `CREATE TABLE IF NOT EXISTS products (
    name varchar(100),
    price varchar(100),
    availability boolean
  )`;

  connection.query(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating the products table: ', err);
      return;
    }
    console.log('Table "products" created or already exists');
  });
});

// Parse JSON bodies
app.use(bodyParser.json());

// API endpoint: /store-products
app.post('/store-products', (req, res) => {
  // Extract the products array from the JSON body
  const products = req.body.products;

  // Check if products array exists and is not empty
  if (!products || products.length === 0) {
    return res.status(400).send('Invalid input');
  }

  // Prepare the SQL statement to insert records into the products table
  const sql = 'INSERT INTO products (name, price, availability) VALUES ?';

  // Prepare the data to be inserted
  const values = products.map((product) => [
    product.name,
    product.price,
    product.availability ? 1 : 0 // Convert boolean value to 0 or 1
  ]);
  // Execute the SQL statement
  connection.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Error inserting records: ', err);
      return res.status(500).send('Internal Server Error');
    }

    console.log(`Inserted ${result.affectedRows} records into the products table`);
    return res.status(200).json({ message: 'Success.' });
  });
});

// API endpoint: /list-products
app.get('/list-products', (req, res) => {
    // Prepare the SQL statement to select all records from the products table
    const sql = 'SELECT * FROM products';
  
    // Execute the SQL statement
    connection.query(sql, (err, result) => {
      if (err) {
        console.error('Error querying the products table: ', err);
        return res.status(500).send('Internal Server Error');
      }
  
      console.log(`Retrieved ${result.length} products from the products table`);
      const products = result.map((row) => ({
        name: row.name,
        price: row.price,
        availability: Boolean(row.availability),
      }));
      return res.status(200).json({ products });
    });
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
