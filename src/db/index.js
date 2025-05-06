// db.js — switched from sqlite3 to better-sqlite3
const Database = require('better-sqlite3');

// Path to your SQLite file
const fileName = './fake-store.sqlite3';

// Synchronous open (creates file if missing)
const createDataBase = (fname) => {
  const db = new Database(fname);
  console.log(`Connected to database through ${fname}`);
  return db;
};

const db = createDataBase(fileName);

// Run a query (INSERT/UPDATE/DELETE) and return lastID/changes
const dbRun = (query, params = []) => {
  return new Promise((res, rej) => {
    try {
      const stmt = db.prepare(query);
      const info = stmt.run(params);
      // Map better-sqlite3's lastInsertRowid to lastID
      res({ lastID: info.lastInsertRowid, changes: info.changes });
    } catch (err) {
      rej(err);
    }
  });
};

// Fetch all rows
const dbAll = (query, params = []) => {
  return new Promise((res, rej) => {
    try {
      const stmt = db.prepare(query);
      const rows = stmt.all(params);
      res(rows);
    } catch (err) {
      rej(err);
    }
  });
};

// Fetch a single row
const dbGet = (query, params = {}) => {
  console.log("in dbGet query, params",query,params)
  return new Promise((res, rej) => {
    try {
      const stmt = db.prepare(query);
      const row = stmt.get(params);
      res(row);
    } catch (err) {
      rej(err);
    }
  });
};

// Close database
const dbClose = () => {
  return new Promise((res) => {
    db.close();
    res();
  });
};

// Test function
const dbTest = async () => {
  const createTable      = `CREATE TABLE IF NOT EXISTS test (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL
  )`;
  const insertRecord     = `INSERT INTO test (name) VALUES (?)`;
  const updateRecord     = `UPDATE test SET name = $name WHERE id = $id`;
  const selectAll        = `SELECT * FROM test`;
  const selectOne        = `SELECT * FROM test WHERE id = $id`;
  const deleteAll        = `DELETE FROM test`;

  try {
    console.log('createRes', await dbRun(createTable));
    console.log('insertRes:', await dbRun(insertRecord, ['testName']));
    console.table(await dbAll(selectAll));

    const myId = (await dbRun(insertRecord, ['another'])).lastID;
    console.log('updateRes:', await dbRun(updateRecord, { $id: myId, $name: 'new name' }));
    console.table(await dbAll(selectAll));

    console.log(await dbGet(selectOne, { $id: myId }));
    console.log('deleted:', await dbRun(deleteAll));
    await dbClose();
  } catch (e) {
    console.error(e);
  }
};

// Table-creation helpers
const createUsersTable = async () => {
  const sql = `CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    email    TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL
  )`;
  try {
    await dbRun(sql);
    return true;
  } catch (e) {
    console.error(`Error in createUsersTable: ${e}`);
    return false;
  }
};

const createOrdersTable = async () => {
  const sql = `CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    uid          INTEGER NOT NULL,
    item_numbers INTEGER NOT NULL,
    is_paid      INTEGER NOT NULL CHECK (is_paid IN (0,1)),
    is_delivered INTEGER NOT NULL CHECK (is_delivered IN (0,1)),
    total_price  INTEGER NOT NULL,
    order_items  TEXT    NOT NULL
  )`;
  try {
    await dbRun(sql);
    return true;
  } catch (e) {
    console.error(`Error in createOrdersTable: ${e}`);
    return false;
  }
};

const createShoppingCartTable = async () => {
  const sql = `CREATE TABLE IF NOT EXISTS cart (
    uid        INTEGER UNIQUE NOT NULL,
    cart_items TEXT    NOT NULL
  )`;
  try {
    await dbRun(sql);
    return true;
  } catch (e) {
    console.error(`Error in createShoppingCartTable: ${e}`);
    return false;
  }
};

(async () => {
  try {
    await createUsersTable();
    await createOrdersTable();
    await createShoppingCartTable();
  } catch (e) {
    console.error('Failed to init Tables:', e);
  }
})();

// Data-access functions
const checkEmailTaken = async (email) => {
  const query = `SELECT * FROM users WHERE email = $email`;
  try {
    const result = await dbGet(query, { email: email });
    return result ? { status: 'error', message: 'The email is already used.' } : { status: 'OK' };
  } catch (e) {
    console.error(`Error in checkEmailTaken: ${e}`);
    return { status: 'error', message: e.message };
  }
};

const createUser = async ({ name, email, password }) => {
  const sql = `INSERT INTO users (name,email,password) VALUES (?,?,?)`;
  try {
    const check = await checkEmailTaken(email);
    if (check.status === 'error') return check;
    const res = await dbRun(sql, [name, email, password]);
    return { status: 'OK', id: res.lastID, name, email };
  } catch (e) {
    console.error(`Error in createUser: ${e}`);
    return { status: 'error', message: 'Failed to insert user!' };
  }
};

const checkUser = async ({ email, password }) => {
  const query = `SELECT * FROM users WHERE email=$email AND password=$password`;
  try {
    const res = await dbGet(query, { email, password });
    return res ? { status: 'OK', id: res.id, name: res.name, email } : { status: 'error', message: 'Wrong email or password.' };
  } catch (e) {
    console.error(`Error in checkUser: ${e}`);
    return { status: 'error', message: 'Failed to login user!' };
  }
};

const updateUser = async ({ userID, name, password }) => {
  if (!name || !password) return { status: 'error', message: "New Name and Password can't be empty." };
  const query = `UPDATE users SET name=$name, password=$password WHERE id=$id`;
  try {
    await dbRun(query, {  name, password, id: userID });
    return { status: 'OK', message: 'User name and password update successfully.', name };
  } catch (e) {
    console.error(`Error in updateUser: ${e}`);
    return { status: 'error', message: 'Failed to update user!' };
  }
};

const deleteUser = async (email) => {
  const query = `DELETE FROM users WHERE email=$email`;
  try {
    const res = await dbRun(query, {  email });
    return { status: 'OK', users: res };
  } catch (e) {
    console.error(`Error in deleteUser: ${e}`);
    return { status: 'error', message: 'Failed to delete user!' };
  }
};

const getAllUsers = async () => {
  try {
    const res = await dbAll(`SELECT * FROM users`);
    return { status: 'OK', users: res };
  } catch (e) {
    console.error(`Error in getAllUsers: ${e}`);
    return { status: 'error', message: 'Failed to get all users!' };
  }
};

const getAllOrders = async () => {
  try {
    const res = await dbAll(`SELECT * FROM orders`);
    return { status: 'OK', orders: res };
  } catch (e) {
    console.error(`Error in getAllOrders: ${e}`);
    return { status: 'error', message: 'Failed to get all orders!' };
  }
};

const getOrdersByUser = async ({ userID }) => {
  try {
    const res = await dbAll(`SELECT * FROM orders WHERE uid = $uid`, { uid: userID });
    return { status: 'OK', orders: res };
  } catch (e) {
    console.error(`Error in getOrdersByUser: ${e}`);
    return { status: 'error', message: 'Failed to get orders by user!' };
  }
};

const createOrder = async ({ userID, items }) => {
  const [itemNumber, totalPrice] = items.reduce(
    ([cnt, sum], itm) => [cnt + itm.quantity, sum + Math.round(itm.quantity * itm.price * 100)],
    [0, 0]
  );
  const orderItems = JSON.stringify(items);
  const sql = `INSERT INTO orders (uid,item_numbers,total_price,order_items,is_paid,is_delivered)
    VALUES (?,?,?,?,?,?)`;
  try {
    const res = await dbRun(sql, [userID, itemNumber, totalPrice, orderItems, 0, 0]);
    return { status: 'OK', id: res.lastID };
  } catch (e) {
    console.error(`Error in createOrder: ${e}`);
    return { status: 'error', message: 'Failed to insert orders!' };
  }
};

const updateOrder = async ({ orderID, isPaid, isDelivered }) => {
  const query = `UPDATE orders SET is_paid=$isPaid, is_delivered=$isDelivered WHERE id=$orderID`;
  try {
    const res = await dbRun(query, { orderID,isPaid, isDelivered });
    return { status: 'OK', result: res };
  } catch (e) {
    console.error(`Error in updateOrder: ${e}`);
    return { status: 'error', message: 'update order error' };
  }
};

const updateCart = async ({ uid, items }) => {
  const sql = `INSERT INTO cart (uid, cart_items)
    VALUES ($uid, $itemstr)
    ON CONFLICT (uid) DO UPDATE SET cart_items=excluded.cart_items`;
  try {
    const res = await dbRun(sql, {  uid, itemstr: JSON.stringify(items) });
    return { status: 'OK', result: res };
  } catch (e) {
    console.error(`Error in updateCart: ${e}`);
    return { status: 'error', message: 'update cart error' };
  }
};

const getCart = async ({ uid }) => {
  try {
    const res = await dbGet(`SELECT * FROM cart WHERE uid=$uid`, {  uid });
    if (!res) return { status: 'OK', items: [] };
    return { status: 'OK', items: JSON.parse(res.cart_items) };
  } catch (e) {
    console.error(`Error in getCart: ${e}`);
    return { status: 'error', message: 'Failed to get cart items!' };
  }
};

module.exports = {
  createUser,
  checkUser,
  getAllUsers,
  deleteUser,
  updateUser,
  getAllOrders,
  createOrder,
  getOrdersByUser,
  updateOrder,
  updateCart,
  getCart,
  dbTest // export test if you like
};
