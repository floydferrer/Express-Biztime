process.env.NODE_ENV = 'test';
const request = require('supertest');
const slugify = require('slugify');
const app = require('../app');
const db = require('../db');

let testCompany;
let invoices;
let industriesList;
beforeEach(async () => {
    const compResults = await db.query(`INSERT INTO companies (code, name, description) VALUES ('Test', 'Test', 'Best test company in the world') RETURNING code, name, description`)
    console.log(compResults.rows[0]);
    testCompany = compResults.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies; DELETE FROM invoices; DELETE FROM industries`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /companies', () => {
    test('Get a list with one company', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompany]} );
    })
})

describe('GET /companies/:code', () => {
    test('Get a single company', async () => {
        const invResults = await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES ('Test', 100, false, null),('Test', 200, false, null) RETURNING comp_Code, amt, paid`);
        invoices = invResults.rows;
        testCompany.invoices = invoices.map(inv => inv.id);
        const indResults = await db.query(`INSERT INTO industries (ind_code, industry) VALUES ('testind', 'Test Ind'), ('testind2', 'Test Ind 2') RETURNING ind_code, industry`);
        industriesList = indResults.rows;
        testCompany.industries = industriesList.map(ind => ind.industry);
        const indCompResults = await db.query(`INSERT INTO industries_companies (ind_code, code) VALUES ('testind', 'Test'), ('testind2', 'Test') RETURNING ind_code, code`);
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: {...testCompany, invoices: [expect.any(Number), expect.any(Number)], industries: testCompany.industries}} );
    })
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get(`/companies/0`);
        expect(res.statusCode).toBe(404);
    })
})

describe('POST /companies', () => {
    test('Create a single company', async () => {
        const res = await request(app).post('/companies').send({ code: slugify('Test2'), name: 'Test2', description: '2nd best test company in the world' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ company: { code: 'Test2', name: 'Test2', description: '2nd best test company in the world' } });
    })
})

describe('PUT /companies', () => {
    test('Updates a single company', async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: 'Test2', description: '2nd best test company in the world??' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: { code: 'Test', name: 'Test2', description: '2nd best test company in the world??' } });
    })
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get(`/companies/0`);
        expect(res.statusCode).toBe(404);
    })
})

describe('DELETE /companies/:code', () => {
    test('Deletes a single company', async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ msg: 'DELETED!'});
    })
})