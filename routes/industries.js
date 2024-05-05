const express = require('express');
const ExpressError = require('../expressError');
const slugify = require('slugify');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    try{
        const results = await db.query('SELECT * FROM industries');
        return res.json({ industries: results.rows });
    } catch(err){
        return next(err);
    } 
})

router.get('/:ind_code', async(req, res, next) => {
    try{
        const ind_code = req.params.ind_code;

        const indCompResult = await db.query(
            `SELECT i.industry, i.ind_code, c.code
            FROM industries AS i
            FULL JOIN industries_companies AS ic
            ON i.ind_code = ic.ind_code
            FULL JOIN companies AS c
            ON c.code = ic.code
            WHERE i.ind_code=$1`,
            [ind_code]
        );

        console.log(indCompResult);

        if (indCompResult.rows.length === 0) {
        throw new ExpressError(`No such company: ${ind_code}`, 404)
        }

        const industries = indCompResult.rows;
        industries.code = industries.map(ind => ind.code);
        return res.json({industry: indCompResult.rows[0].industry, ind_code: indCompResult.rows[0].ind_code, comp_code: industries.code});
    } catch(err) {
        return next(err)
    }
})

router.post('/', async(req, res, next) => {
    try{
        const { industry } = req.body;
        const results = await db.query('INSERT INTO industries (ind_code, industry) VALUES ($1, $2) RETURNING ind_code, industry', [slugify(industry), industry]);
        return res.status(201).json({industry: results.rows[0]});
    } catch(err) {
        return next(err)
    }
})

router.post('/:ind_code', async(req, res, next) => {
    try{
        const ind_code = req.params.ind_code;
        const comp_code = req.body.comp_code;
        
        const checkIndComp = await db.query(
            `SELECT ind_code, code
            FROM industries_companies
            WHERE ind_code=$1 AND code=$2`,
            [ind_code, comp_code]
        );
        
        const checkComp = await db.query(
            `SELECT code
            FROM companies
            WHERE code=$1`,
            [comp_code]
        );
        if (checkIndComp.rows[0] && comp_code === checkIndComp.rows[0].code) {
            throw new ExpressError(`Company already included: ${comp_code}`, 402);
        } else if (checkComp.rows.length === 0) {
            throw new ExpressError(`No such company: ${comp_code}`, 404)
        }

        await db.query('INSERT INTO industries_companies (ind_code, code) VALUES ($1, $2) RETURNING ind_code, code', [ind_code, comp_code])

        const indCompResult = await db.query(
            `SELECT ind_code, code
            FROM industries_companies
            WHERE ind_code=$1 AND code=$2`,
            [ind_code, comp_code]
        );

        return res.json({industry: {ind_code: indCompResult.rows[0].ind_code, comp_code: indCompResult.rows[0].code}});
    } catch(err) {
        return next(err)
    }
})

module.exports = router;