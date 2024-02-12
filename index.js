// Step 1: Setting Up the Project
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Step 2: Database Setup
const db = new sqlite3.Database(':memory:'); // In-memory database for demo purposes

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE Users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            email TEXT
        )
    `);

    db.run(`
        CREATE TABLE Companies (
            id INTEGER PRIMARY KEY,
            name TEXT,
            employees INTEGER
        )
    `);

    db.run(`
        CREATE TABLE Clients (
            id INTEGER PRIMARY KEY,
            name TEXT,
            user_id INTEGER,
            company_id INTEGER,
            email TEXT,
            phone TEXT,
            FOREIGN KEY (user_id) REFERENCES Users(id),
            FOREIGN KEY (company_id) REFERENCES Companies(id)
        )
    `);

    db.run(`
        CREATE TABLE ClientUsers (
            id INTEGER PRIMARY KEY,
            client_id INTEGER,
            user_id INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            deletedAt DATETIME,
            active BOOLEAN,
            FOREIGN KEY (client_id) REFERENCES Clients(id),
            FOREIGN KEY (user_id) REFERENCES Users(id)
        )
    `);

    // Insert sample data for demonstration
    db.run(`
        INSERT INTO Users (username, email) VALUES ('user1', 'user1@example.com')
    `);

    db.run(`
        INSERT INTO Companies (name, employees) VALUES ('Company A', 100)
    `);
});

// Step 3: Building Entities

// User model
class User {
    constructor(id, username, email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }
}

// Company model
class Company {
    constructor(id, name, employees) {
        this.id = id;
        this.name = name;
        this.employees = employees;
    }
}

// Client model
class Client {
    constructor(id, name, userId, companyId, email, phone) {
        this.id = id;
        this.name = name;
        this.userId = userId;
        this.companyId = companyId;
        this.email = email;
        this.phone = phone;
    }
}

// ClientUser model (junction table between clients and users)
class ClientUser {
    constructor(id, clientId, userId, createdAt, updatedAt, deletedAt, active) {
        this.id = id;
        this.clientId = clientId;
        this.userId = userId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.active = active;
    }
}
// Step 4: API Endpoints
app.use(bodyParser.json());

// List Users (Accessible by all roles)
app.get('/users', (req, res) => {
    db.all('SELECT * FROM Users', (err, rows) => {
        if (err) {
            res.status(500).send('Error fetching users');
        } else {
            res.send(rows);
        }
    });
});

// Update User (Accessible by all roles)
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, email } = req.body;

    db.run('UPDATE Users SET username=?, email=? WHERE id=?', [username, email, userId], function (err) {
        if (err) {
            res.status(500).send('Error updating user');
        } else {
            res.send(User with ID ${userId} updated successfully);
        }
    });
});

// Create Client (Accessible only by users with ROLE_ADMIN)
app.post('/clients', authorize('ROLE_ADMIN'), (req, res) => {
    const { name, user_id, company_id, email, phone } = req.body;

    // Validate company and user existence - this is just a placeholder, actual implementation might differ
    const companyExists = true; // Placeholder for company existence check
    const userExists = true; // Placeholder for user existence check

    if (!companyExists || !userExists) {
        res.status(400).send('Invalid company or user');
        return;
    }

    db.run('INSERT INTO Clients (name, user_id, company_id, email, phone) VALUES (?, ?, ?, ?, ?)',
        [name, user_id, company_id, email, phone], function (err) {
            if (err) {
                res.status(500).send('Error creating client');
            } else {
                res.send('Client created successfully');
            }
        });
});

// Update Client (Accessible by all roles)
app.put('/clients/:id', (req, res) => {
    const clientId = req.params.id;
    const { name, email, phone } = req.body;

    db.run('UPDATE Clients SET name=?, email=?, phone=? WHERE id=?', [name, email, phone, clientId], function (err) {
        if (err) {
            res.status(500).send('Error updating client');
        } else {
            res.send(Client with ID ${clientId} updated successfully);
        }
    });
});

// Step 5: SQL Queries
// Companies by Employee Range
const companiesByEmployeeRangeQuery = `
    SELECT * FROM Companies WHERE employees >= ? AND employees <= ?
`;

// Clients by User and Name
const clientsByUserAndNameQuery = `
    SELECT * FROM Clients WHERE user_id = ? AND name LIKE ?
`;

// Step 6: Security - Role-based Access Control Middleware
function authorize(role) {
    return (req, res, next) => {
        // Example: Check if user has ROLE_ADMIN
        const userRole = 'ROLE_ADMIN'; // Assuming this is fetched from user authentication
        if (userRole === role) {
            next(); // Allow access
        } else {
            res.status(403).send('Unauthorized'); // Access forbidden
        }
    };
}

// Step 7: Regular Expressions - Email Validation
function validateEmail(email) {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    return emailRegex.test(email);
}

// Step 8: Documentation
// Document each API endpoint here

// Start the server
app.listen(port, () => {
    console.log(Server running on port ${port});
})
