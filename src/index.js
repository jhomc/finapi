const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

const customers = [];

app.use(express.json());

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type == "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

//Midleware
function verifyIfAccountExistsCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found!" });
  }

  request.customer = customer;

  return next();
}
//end
app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const costumerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (costumerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    name,
    cpf,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

app.get("/statement", verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post("/deposit", verifyIfAccountExistsCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.post("/withdraw", verifyIfAccountExistsCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get("/statement/date", verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  console.log(statement);

  return response.json(statement);
});

app.put("/account", verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer);
});

app.delete("/account", verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);
  return response.status(204).send();
});

app.get("/balance", verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);
