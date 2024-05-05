\c biztime

DROP TABLE IF EXISTS industries_companies;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS industries;


CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
    ind_code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

CREATE TABLE industries_companies (
    ind_code text REFERENCES industries ON DELETE CASCADE,
    code text REFERENCES companies ON DELETE CASCADE
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.'),
         ('amazon', 'Amazon', 'Greatest Online Marketplace.');

INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

INSERT INTO industries
  VALUES ('tech', 'Technology'),
         ('e-comm', 'e-Commerce'),
         ('retail', 'Retail');

INSERT INTO industries_companies
  VALUES ('tech', 'apple'),
         ('e-comm', 'amazon'),
         ('retail', 'amazon'),
         ('tech', 'ibm');
