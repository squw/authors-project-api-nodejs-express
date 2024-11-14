import { sqlConfig } from './sqlConfig';

const express = require('express');
const app = express();
const sql = require('mssql');
const PORT = 8080;

// Enable CORS
const cors = require('cors');
app.use(cors());

// Middleware
app.use(express.json());





// Route to display authors table
app.get('/author_table_display', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        
        const result = await sql.query`SELECT * FROM authors`;

        // Response
        res.status(200).send({
            Message: "Data retrieved successfully",
            Result: true,
            Data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error retrieving data from author table",
            Result: false,
            Data: null
        });
    } finally {
        await sql.close();
    }
});

// Route to get data for a specific author by au_id
app.get('/author/:id', async (req, res) => {
    const authorId = req.params.id;
    
    try {
        await sql.connect(sqlConfig);
        
        const result = await sql.query`SELECT * FROM authors WHERE au_id = ${authorId}`;
        


        if (result.recordset.length > 0) {
            res.status(200).send({
                Message: "Author data retrieved successfully",
                Result: true,
                Data: result.recordset[0]
            });
        } else {
            res.status(404).send({
                Message: "Author not found",
                Result: false,
                Data: null
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error retrieving author data",
            Result: false,
            Data: null
        });
    } finally {
        await sql.close();
    }
});


app.put('/author/:id/update', async (req, res) => {
    
    const { au_id, au_lname, au_fname, phone, address, city, state, zip, contract } = req.body;

    try {
        await sql.connect(sqlConfig)

        const result = await sql.query`
            UPDATE authors
            SET
                au_lname = ${au_lname},
                au_fname = ${au_fname},
                phone = ${phone},
                address = ${address},
                city = ${city},
                state = ${state},
                zip = ${zip},
                contract = ${contract}
            WHERE au_id = ${au_id}
        `;


        if (result.rowsAffected[0] > 0) {
            res.status(200).send({
                Message: "Author data updated successfully",
                Result: true,
                Data: null
            })
        } else {
            res.status(404).send({
                Message: "Author not found",
                Result: false,
                Data: null
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error updating author data",
            Result: false,
            Data: null
        });
    } finally {
        await sql.close();
    }
});



app.post('/author/create', async (req, res) => {
    const { au_id, au_lname, au_fname, phone, address, city, state, zip, contract } = req.body;

    const address_post  = address || null;
    const city_post = city || null;
    const state_post = state || null;
    const zip_post = zip || null;


    try {
        await sql.connect(sqlConfig);
        
        const result = await sql.query`
            INSERT INTO authors (au_id, 
                                 au_lname, 
                                 au_fname, 
                                 phone, 
                                 address, 
                                 city, 
                                 state, 
                                 zip, 
                                 contract)
            VALUES              (${au_id}, 
                                 ${au_lname}, 
                                 ${au_fname}, 
                                 ${phone}, 
                                 ${address_post}, 
                                 ${city_post}, 
                                 ${state_post}, 
                                 ${zip_post}, 
                                 ${contract})
        `;

        if (result.rowsAffected[0] > 0) {
            res.status(201).send({
                Message: "Author created successfully",
                Result: true,
                Data: {
                    au_id,
                    au_lname,
                    au_fname,
                    phone,
                    address,
                    city,
                    state,
                    zip,
                    contract
                }
            });
        } else {
            res.status(400).send({
                Message: "Failed to create author",
                Result: false,
                Data: null
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error creating new author",
            Result: false,
            Data: null
        });
    } finally {
        await sql.close();
    }
});


app.get('/author/check-id/:id', async (req, res) => {
    const authorId = req.params.id;

    try {
        await sql.connect(sqlConfig)

        const result = await sql.query`
            SELECT COUNT(*) AS count 
            FROM authors 
            WHERE au_id = ${authorId}
        `

        const exists = result.recordset[0].count > 0;

        res.status(200).send({
            Message: "Check completed successfully",
            Result: true,
            Exists: exists
        })
    } catch (error) {
        console.error(error)
        res.status(500).send({
            Message: "Error checking for duplicated author ID",
            Result: false,
            Exists: null
        })
    } finally {
        await sql.close();
    }
});


app.delete('/author/delete/:id', async (req, res) => {
    const authorId= req.params.id;

    try {
        await sql.connect(sqlConfig);
        const result = await sql.query`
            DELETE FROM authors 
            WHERE au_id = ${authorId}
        `;

        if (result.rowsAffected[0] > 0) {
            res.status(200).send({
                Message: "Author deleted successfully",
                Result: true
            });
        } else {
            res.status(404).send({
                Message: "Author not found",
                Result: false
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error deleting author",
            Result: false
        });
    } finally {
        await sql.close();
    }
});


// Start the server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));