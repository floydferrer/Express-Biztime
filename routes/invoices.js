const express = require('express');
const ExpressError = require('../expressError')
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    try{
        const results = await db.query('SELECT * FROM invoices');
        return res.json({ invoices: results.rows });
    } catch(err){
        return next(err);
    } 
})

router.get('/:id', async(req, res, next) => {
    try{
        const { id } = req.params;
        const results = await db.query(
            'SELECT * FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE id=$1', [id]
        );
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find id with id of ${id}`, 404)
        }
        const data = results.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description
            }
        }
        return res.send({ invoices: invoice });
    } catch(err) {
        return next(err)
    }
})

router.post('/', async(req, res, next) => {
    try{
        const { comp_code, amt } = req.body;
        const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING comp_code, amt', [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]});
    } catch(err) {
        return next(err)
    }
})

router.put('/:id', async(req, res, next) => {
    try{
        const { id } = req.params;
        const { amt } = req.body;
        let paid_date;
        let results;
        if (req.body.amt === 0.001) {
            paid = true;
            paid_date = new Date();
            results = await db.query(
                'UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *', [amt, paid, paid_date, id]
            );
        } else {
            paid = false;
            paid_date = null;
            results = await db.query(
                'UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *', [amt, paid, paid_date, id]
            );
        }
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        }
        return res.status(200).json({invoice: results.rows[0]});
    } catch(err) {
        return next(err)
    }
})

router.delete('/:id', async(req, res, next) => {
    try{
        const { id } = req.params;
        const results = await db.query(
            'DELETE FROM invoices WHERE id = $1', [id]
        );
        return res.send({ msg: 'DELETED!' });
    } catch(err) {
        return next(err)
    }
})

module.exports = router;