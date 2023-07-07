var express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

var app = express();

const connectionConfig = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'mydb'
};

mysql.createConnection(connectionConfig)
    .then(async (connection) => {
        console.log('Connected to MySQL database!');
        await createProductsTable(connection);
    })
    .catch((err) => {
        console.error('Error connecting to MySQL database:', err);
    });

// Function to create "products" table if it doesn't exist
async function createProductsTable(connection) {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                name VARCHAR(100),
                price DECIMAL(10, 2),
                availability BOOLEAN
            )
        `);
        console.log('Products table created or already exists.');
    } catch (error) {
        console.error('Error creating products table:', error);
    }
}

app.use(express.json());

app.get('/', function (req, res) {
    res.send('Hello World!');
});

router.post('/store-products', async (req, res) => {
    const { products } = req.body;

    // Validate the products array
    if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Invalid products array' });
    }

    const connection = await mysql.createConnection(connectionConfig);

    try {
        const insertQuery = 'INSERT INTO products (name, price, availability) VALUES (?, ?, ?)';

        for (const product of products) {
            await connection.execute(insertQuery, [product.name, product.price, product.availability]);
        }

        console.log(`Inserted ${products.length} records into products table.`);
        res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.error('Error inserting records into products table:', error);
        res.status(500).json({ error: 'Error inserting records into products table' });
    } finally {
        connection.end();
    }
});

router.get('/list-products', async (req, res) => {
    const connection = await mysql.createConnection(connectionConfig);

    try {
        const selectQuery = 'SELECT name, price, availability FROM products';
        const [rows] = await connection.execute(selectQuery);

        const products = rows.map((row) => ({
            name: row.name,
            price: row.price,
            availability: row.availability === 1 ? true : false
        }));

        res.status(200).json({ products });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Error retrieving products' });
    } finally {
        connection.end();
    }
});


app.use(router);

app.listen(80, function () {
    console.log('Example app listening on port 3000!');
});
