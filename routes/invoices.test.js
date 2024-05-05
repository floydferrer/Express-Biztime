process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;
beforeEach(async () => {
    await db.query(`INSERT INTO companies (code, name, description) VALUES ('test', 'Test', 'Best test company in the world') RETURNING code, name, description`)
    const invResults = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('test', '3000') RETURNING id, comp_code, amt, paid, add_date, paid_date`)
    testInvoice = invResults.rows[0];
    testInvoice.add_date = testInvoice.add_date.toISOString();
});

afterEach(async () => {
    await db.query(`DELETE FROM companies; DELETE FROM invoices`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /invoices', () => {
    test('Get a list with one invoice', async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: [testInvoice] });
    })
})

describe('GET /invoices/:id', () => {
    test('Get a single company', async () => {
        const compResults = await db.query(`
            SELECT code, name, description
            FROM companies AS c
            JOIN invoices AS i
            ON i.comp_code = c.code
            WHERE i.id = ${testInvoice.id}
        `);
        
        company = compResults.rows;
        testInvoice.company = company.map(comp => comp);
        console.log(testInvoice);
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: {
            id: testInvoice.id,
            amt: testInvoice.amt,
            paid: testInvoice.paid,
            add_date: testInvoice.add_date,
            paid_date: testInvoice.paid_date,
            company: {
                code: testInvoice.company[0].code,
                name: testInvoice.company[0].name,
                description: testInvoice.company[0].description
                }
            }
        });
    })
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    })
})

describe('POST /invoices', () => {
    test('Create a single invoice', async () => {
        const res = await request(app).post('/invoices').send({ comp_code: 'test', amt: 5000 });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ invoice: { comp_code: 'test', amt: 5000 } });
    })
})

describe('PUT /invoices', () => {
    test('Updates a single invoice', async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ comp_code: 'test', amt: 7000 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: { id: testInvoice.id, comp_code: 'test', amt: 7000, add_date: testInvoice.add_date, paid: testInvoice.paid, paid_date: testInvoice.paid_date  } });
    })
    test('Updates a single invoice to paid', async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ comp_code: 'test', amt: 0.001 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: { id: testInvoice.id, comp_code: 'test', amt: 0.001, add_date: testInvoice.add_date, paid: true, paid_date: expect.any(String) } });
    })
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    })
})

describe('DELETE /invoices/:id', () => {
    test('Deletes a single company', async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ msg: 'DELETED!'});
    })
})