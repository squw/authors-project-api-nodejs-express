const express = require('express');
const app = express();
const sql = require('mssql');
const PORT = 8080;

// Enable CORS
const cors = require('cors');
app.use(cors());

// Middleware
app.use(express.json());


require('dotenv').config();

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    options: {
        encrypt: true, // Use encryption for Azure
        trustServerCertificate: true // True for local dev / self-signed certs
    }
};

// Route to display authors table
app.get('/author/table-display', async (req, res) => {
    try {
        await sql.connect(sqlConfig);

        const result = await sql.query`SELECT * FROM authors`;

        // Response
        res.status(200).send({
            Message: "Author data retrieved successfully",
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


// Route to display titles table
app.get('/title/table-display', async (req, res) => {
    try {
        await sql.connect(sqlConfig);

        const result = await sql.query`SELECT * FROM titles`;

        res.status(200).send({
            Message: "Title data retrieved successfully",
            Result: true,
            Data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error retrieving data from title table",
            Result: false,
            Data: null
        })
    } finally {
        await sql.close();
    }
});


// Route to display publishers table
app.get('/publisher/table-display', async (req, res) => {
    try {
        await sql.connect(sqlConfig);

        const result = await sql.query`SELECT pub_id, pub_name FROM publishers`;

        res.status(200).send({
            Message: "Title data retrieved successfully",
            Result: true,
            Data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error retrieving data from title table",
            Result: false,
            Data: null
        })
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


// Route to get data for a specific title by title_id
app.get('/title/:id', async (req, res) => {
    const titleId = req.params.id;

    try {
        await sql.connect(sqlConfig);

        const result = await sql.query`
            SELECT 
                t.title_id,
                t.title,
                TRIM(t.type) AS type,
                t.pub_id,
                p.pub_name,
                t.price,
                t.advance,
                t.royalty,
                t.ytd_sales,
                t.notes,
                t.pubdate,
                COUNT(s.ord_num) AS sales_count
            FROM 
                titles t
            LEFT JOIN 
                publishers p ON t.pub_id = p.pub_id
            LEFT JOIN 
                sales s ON t.title_id = s.title_id
            WHERE 
                t.title_id = ${titleId}
            GROUP BY 
                t.title_id, t.title, t.type, t.pub_id, p.pub_name, t.price, t.advance, t.royalty, t.ytd_sales, t.notes, t.pubdate;
        `;



        if (result.recordset.length > 0) {
            res.status(200).send({
                Message: "Title data retrieved successfully",
                Result: true,
                Data: result.recordset[0]
            });
        } else {
            res.status(404).send({
                Message: "Title not found",
                Result: false,
                Data: null
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error retrieving title data",
            Result: false,
            Data: null
        });
    } finally {
        await sql.close();
    }
});

// Route to display title author(s)
app.get('/title/:id/author', async (req, res) => {
    const titleId = req.params.id;

    try {
        await sql.connect(sqlConfig);

        const result = await sql.query`
            SELECT 
                ta.au_id,
                a.au_fname,
                a.au_lname,
                ta.au_ord,
                ta.royaltyper
            FROM titleauthor ta
            JOIN authors a ON a.au_id = ta.au_id
            WHERE title_id = ${titleId}
            ORDER BY ta.au_ord
        `;

        res.status(200).send({
            Message: "Title author data retrieved successfully",
            Result: true,
            Data: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error retrieving data from title author table",
            Result: false,
            Data: null
        })
    } finally {
        await sql.close();
    }
});


// Route to update author details
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


// Route to update title details
app.put('/title/:id/update', async (req, res) => {

    const { title_id, title, type, pub_id, price, advance, royalty, ytd_sales, notes, pubdate } = req.body;

    try {
        await sql.connect(sqlConfig)

        const result = await sql.query`
            UPDATE titles
            SET
                title = ${title},
                type = ${type},
                pub_id = ${pub_id},
                price = ${price},
                advance = ${advance},
                royalty = ${royalty},
                ytd_sales = ${ytd_sales},
                notes = ${notes},
                pubdate = ${pubdate}
            WHERE title_id = ${title_id}
        `;


        if (result.rowsAffected[0] > 0) {
            res.status(200).send({
                Message: "Title data updated successfully",
                Result: true,
                Data: null
            })
        } else {
            res.status(404).send({
                Message: "Title not found",
                Result: false,
                Data: null
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error updating title data",
            Result: false,
            Data: null
        });
    } finally {
        await sql.close();
    }
});

// Route to create new author
app.post('/author/create', async (req, res) => {
    const { au_id, au_lname, au_fname, phone, address, city, state, zip, contract } = req.body;
    
    const phone_post = phone || null;
    const address_post = address || null;
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
                                 ${phone_post}, 
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
                    address_post,
                    city_post,
                    state_post,
                    zip_post,
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


// Route to create new title
app.post('/title/create', async (req, res) => {
    const { title_id, title, type, pub_id, price, advance, royalty, ytd_sales, notes, pubdate } = req.body

    const pub_id_post = pub_id || null
    const price_post = price || null
    const advance_post = advance || null
    const royalty_post = royalty || null
    const ytd_sales_post = ytd_sales || null
    const notes_post = notes || null

    try {
        await sql.connect(sqlConfig)

        const result = await sql.query`
            INSERT INTO titles
            VALUES (${title_id},
                    ${title},
                    ${type},
                    ${pub_id_post},
                    ${price_post},
                    ${advance_post},
                    ${royalty_post},
                    ${ytd_sales_post},
                    ${notes_post},
                    ${pubdate})
        `;

        if (result.rowsAffected[0] > 0) {
            res.status(201).send({
                Message: "Title created successfully",
                Result: true,
                Data: {
                    title_id,
                    title,
                    type,
                    pub_id_post,
                    price_post,
                    advance_post,
                    royalty_post,
                    ytd_sales_post,
                    notes_post,
                    pubdate
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
            Message: "Error creating new title",
            Result: false,
            Data: null
        });
    } finally {
        await sql.close();
    }
});

// Route to add author to a title
app.post('/title/:id/author/add', async (req, res) => {
    const titleId = req.params.id;

    const { au_id, au_ord, royaltyper } = req.body;

    try {
        await sql.connect(sqlConfig);
        const result = await sql.query`
            INSERT INTO titleauthor (
                                     au_id,
                                     title_id,
                                     au_ord,
                                     royaltyper
            )
            VALUES                  (
                                     ${au_id},
                                     ${titleId},
                                     ${au_ord},
                                     ${royaltyper}
            )
        `
        if (result.rowsAffected[0] > 0) {
            res.status(201).send({
                Message: "Author created successfully",
                Result: true,
                Data: {
                    au_id,
                    titleId,
                    au_ord,
                    royaltyper
                }
            })
        } else {
            res.status(400).send({
                Message: "Failed to add author",
                Result: false,
                Data: null
            });
        } 

    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error adding new author",
            Result: false,
            Data: error
        });
    } finally {
        await sql.close();
    }
});


// Route for checking duplicate author ID upon creation
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


// Route for checking duplicate title ID upon creation
app.get('/title/check-id/:id', async (req, res) => {
    const titleId = req.params.id;

    try {
        await sql.connect(sqlConfig)

        const result = await sql.query`
            SELECT COUNT(*) AS count 
            FROM titles 
            WHERE title_id = ${titleId}
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
            Message: "Error checking for duplicated title ID",
            Result: false,
            Exists: null
        })
    } finally {
        await sql.close();
    }
});

// Route to check whether author has titles associated upon delete
app.get('/author/check-titles/:id', async (req, res) => {
    const authorId = req.params.id

    try {
        await sql.connect(sqlConfig)

        const result = await sql.query`
            SELECT COUNT(*) AS count
            FROM titleauthor
            WHERE au_id = ${authorId}
        `

        const exists = result.recordset[0].count > 0;

        res.status(200).send({
            Message: "Check for author title completed successfully",
            Result: true,
            Exists: exists
        })
    } catch (error) {
        console.error(error)
        res.status(500).send({
            Message: "Error checking for author title",
            Result: false,
            Exists: exists
        })
    } finally {
        await sql.close();
    }
});

// Route to check whether title has sales associated upon delete
app.get('/title/check-sales/:id', async (req, res) => {
    const titleId = req.params.id

    try {
        await sql.connect(sqlConfig)

        const result = await sql.query`
            SELECT COUNT(*) AS count
            FROM sales
            WHERE title_id = ${titleId}
        `

        const exists = result.recordset[0].count > 0;

        res.status(200).send({
            Message: "Check for title sales completed successfully",
            Result: true,
            Exists: exists
        })
    } catch (error) {
        console.error(error)
        res.status(500).send({
            Message: "Error checking for title sales",
            Result: false,
            Exists: exists
        })
    } finally {
        await sql.close();
    }
});


// Route to delete author
app.delete('/author/delete/:id', async (req, res) => {
    const authorId = req.params.id;

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


// Route to delete title
app.delete('/title/delete/:id', async (req, res) => {
    const titleId = req.params.id;

    try {
        await sql.connect(sqlConfig);
        const transaction = new sql.Transaction();
        await transaction.begin();

        try {

            // remove entries from titleauthor table
            await transaction.request().query`
                DELETE FROM titleauthor
                WHERE title_id = ${titleId}
            `;

            // remove entries from roysched table
            await transaction.request().query`
                DELETE FROM roysched
                WHERE title_id = ${titleId}
            `;

            // remove title entry
            const result = await transaction.request().query`
                DELETE FROM titles
                WHERE title_id = ${titleId}
            `;

            if (result.rowsAffected[0] > 0) {
                await transaction.commit();
                res.status(200).send({
                    Message: "Title and related entries deleted successfully",
                    Result: true
                })
            } else {
                await transaction.rollback();
                res.status(404).send({
                    Message: "Title not found",
                    Result: false
                })
            }
        } catch (queryError) {
            await transaction.rollback();
            console.error(queryError);
            res.status(500).send({
                Message: "Error deleting title and related entries",
                Result: false
            })
        }

    } catch (error) {
        console.error(error);
        res.status(500).send({
            Message: "Error connecting to database",
            Result: false
        });
    } finally {
        await sql.close();
    }
});

// Route to delete author associated with title
app.delete('/title/:title_id/author/delete/:au_id', async (req, res) => {
    const title_id = req.params.title_id;
    const au_id = req.params.au_id;

    try {
        await sql.connect(sqlConfig);

        const result = await sql.query`
            DELETE FROM titleauthor
            WHERE title_id = ${title_id}
            AND au_id = ${au_id}
        `

        if (result.rowsAffected[0] > 0) {
            res.status(200).send({
                Message: "Author deleted successfully from title",
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
            Message: "Error deleting author from title",
            Result: false
        });
    } finally {
        await sql.close();
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));