const express = require('express');
const ExpressError = require('../expressError');
const slugify = require('slugify');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    try{
        const results = await db.query('SELECT * FROM companies');
        return res.json({ companies: results.rows });
    } catch(err){
        return next(err);
    } 
})

router.get('/:code', async(req, res, next) => {
    try{
        let code = req.params.code;

        const compResult = await db.query(
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
            [code]
        );

        const invResult = await db.query(
            `SELECT id
            FROM invoices
            WHERE comp_code = $1`,
            [code]
        );

        const indResults = await db.query(
            `SELECT i.industry FROM companies AS c
            JOIN industries_companies AS ic
            ON c.code = ic.code
            JOIN industries AS i
            ON ic.ind_code = i.ind_code
            WHERE c.code = $1`,
            [code]
        )

        if (compResult.rows.length === 0) {
        throw new ExpressError(`No such company: ${code}`, 404)
        }

        const company = compResult.rows[0];
        const invoices = invResult.rows;
        const industries = indResults.rows;

        company.invoices = invoices.map(inv => inv.id);
        company.industries = industries.map(ind => ind.industry);

        return res.json({"company": company});
    } catch(err) {
        return next(err)
    }
})

router.post('/', async(req, res, next) => {
    try{
        const { name, description } = req.body;
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [slugify(name), name, description]);
        return res.status(201).json({company: results.rows[0]});
    } catch(err) {
        return next(err)
    }
})

router.put('/:code', async(req, res, next) => {
    try{
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(
            'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *', [name, description, code]
        );
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find code with code of ${code}`, 404)
        }
        return res.status(200).json({company: results.rows[0]});
    } catch(err) {
        return next(err)
    }
})

router.delete('/:code', async(req, res, next) => {
    try{
        const { code } = req.params;
        const results = await db.query(
            'DELETE FROM companies WHERE code = $1 RETURNING *', [code]
        );
        return res.send({ msg: 'DELETED!' });
    } catch(err) {
        return next(err)
    }
})

module.exports = router;