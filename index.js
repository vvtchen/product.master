///server
const { response, query } = require("express");
const express = require("express");
const app = express();

app.listen(3000, () => console.log("listening at 3000"));

//.env file
const dotenv = require("dotenv");
dotenv.config();

// older version needs to install bodyParser, but in the latest version we can use urlencoded
const bodyParser = require("body-parser");
app.use(bodyParser.json());

//parse form data, middleware function allow us to proceed form data
app.use(express.urlencoded({ extended: true }));

//parse json data
app.use(express.json());

//middleware unless module
var { unless } = require("express-unless");

//modules to read excel file
const fs = require("fs");
const path = require("path");
const readXlsxFile = require("read-excel-file/node");
const multer = require("multer");

//modile required to upload file from browser
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});
const uploadFile = multer({ storage: storage });

//ejs module
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/// mongo db
const mongoose = require("mongoose");
mongoose
  .connect(process.env.mongooseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to mongodb!"))
  .catch((err) => console.error("Error connecting to database:", err));

const User = require("./User");

///mysql database
const mysql = require("mysql2");
const { log, info } = require("console");
const e = require("express");
const con = mysql.createConnection({
  host: "localhost",
  user: process.env.mysqlUser,
  password: process.env.mysqlUserPassword,
  database: "products",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to mysql!");
});

/// data validation hapi/joi
const Joi = require("@hapi/joi");
const schema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().min(6).max(300).required().email(),
  password: Joi.string().min(6).max(1024).required(),
});

/// use function to make validation
/**
 In this way we can make multiple validation in another file and then validete data in different purpose
 */
const { registerValidation, loginValidation } = require("./auth");

const { genSalt } = require("bcryptjs");

// hash password module
const bcrypt = require("bcryptjs");

//create and assign json web token module
const jwt = require("jsonwebtoken");

//cookie parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

///route

//log out route
app.get("/logout", (req, res) => {
  // Clear the auth-token cookie
  res.clearCookie("auth-token");
  res.status(200).redirect("/login");
});

// register route;
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res, next) => {
  //check if the data is validate
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  //check if the data is already used?
  const exist = await User.findOne({ email: req.body.email });
  if (exist) {
    return res.status(400).send("Email already exists");
  }

  //hash the password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashPassword,
  });
  try {
    const savedUser = await user.save();
    res.redirect("/login");
  } catch (err) {
    res.status(400).send(err);
  }
});

// login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res, next) => {
  //validate
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  //find user in database
  const existUser = await User.findOne({ email: req.body.email });
  if (!existUser) {
    return res.status(400).send("Email or Password is wrong");
  }

  //compare the password with hashpassword
  const hashPassword = bcrypt.compare(req.body.password, existUser.password);
  if (!hashPassword) {
    return res.status(400).send("Invalid User");
  }

  const token = jwt.sign({ _id: existUser._id }, process.env.Token_Secret);
  const expirationTime = new Date(Date.now() + 1000 * 60 * 60 * 24);
  res
    .cookie("auth-token", token, {
      httpOnly: true,
      secure: true,
      expires: expirationTime,
    })
    .redirect("index.html");
});

/// verify token middleware
const auth = require("./token");
app.use(
  auth.unless({
    path: ["/login.css"],
  })
);

const { Template } = require("ejs");
const { result } = require("@hapi/joi/lib/base");
const { url } = require("inspector");

// static method allow as to static all files under the filename
app.use(express.static("public"));
app.use("/script", express.static(path.join(__dirname, "/script")));
//import products info by templates
app.post(
  "/import-excel",
  uploadFile.single("import-excel"),
  async (req, res, next) => {
    function importFileToDb(exFile) {
      readXlsxFile(exFile).then(async (rows) => {
        rows.shift();

        const checkExist = await Query(
          `Select vendorName from vendor where vendorName = '${rows[0][0]}'`
        );
        if (checkExist.length === 0) {
          return res.render("importProductError", {
            errorMessage: "Can't find vendor with this name",
          });
        }
        let query =
          "INSERT INTO productInfo (vendorName, title, modelNO, vendorPrice, sellPrice, packageNo, packageCost, image_url) VALUES ?";
        con.query(query, [rows], function (err, result) {
          if (err) {
            throw err;
          }
          res.render("productImport", {
            msg: `Created ${result.affectedRows} Products`,
          });
        });
      });
    }
    async function checkValid(exFile) {
      let result = true;
      let rows = await readXlsxFile(exFile); // Wait for the file to be read
      rows.shift();
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].length !== 8) {
          result = false;
        } else {
          for (let j = 0; j < rows[i].length; j++) {
            if (rows[i][j] == null) {
              result = false;
            }
          }
        }
      }
      return result;
    }

    let signal = await checkValid(__dirname + "/uploads/" + req.file.filename);
    if (signal) {
      importFileToDb(__dirname + "/uploads/" + req.file.filename);
    } else {
      res.render("importProductError", {
        errorMessage: "Error Template Format",
      });
    }
  }
);

//import sales data
app.post(
  "/import-sales",
  uploadFile.single("import-excel"),
  async function (req, res, next) {
    function importSales(exFile) {
      readXlsxFile(exFile).then(async (rows) => {
        rows.shift();
        for (let row of rows) {
          let id = row[1];
          let quantity = row[4];
          let cogs = 0;
          let results = await getCogs(id);
          let vendor = await getVendor(id);
          for (let result of results) {
            if (quantity <= result.inventory) {
              cogs += quantity * result.purchasePrice;
              row.push(row[3] * row[4] - cogs);
              const update = `update invoice set soldUnits = soldUnits + ${quantity} where invoice_id = '${result.invoice_id}' and product_id = '${id}'`;
              con.query(update, (err, data) => {
                if (err) throw err;
              });
              break;
            } else {
              cogs += result.inventory * result.purchasePrice;
              const update = `update invoice set soldUnits = soldUnits + ${result.inventory} where invoice_id = '${result.invoice_id}' and product_id = '${id}'`;
              con.query(update, (err, data) => {
                if (err) throw err;
              });
              quantity -= result.inventory;
            }
          }
          row.push(vendor[0].vendorName);
        }
        con.connect((error) => {
          if (error) {
            console.error(error);
          } else {
            let query = `INSERT INTO sales (sales_id, product_id, title, soldPrice, soldUnits, sales_date, profit, vendorName) VALUES ?`;
            con.query(query, [rows], function (err, result) {
              if (err) throw err;
            });

            for (let i = 0; i < rows.length; i++) {
              const update = `UPDATE productInfo SET totalSoldUnits = totalSoldUnits + ${Number(
                rows[i][4]
              )}, GMS = GMS + ${
                Number(rows[i][3]) * Number(rows[i][4])
              } WHERE id = ${Number(rows[i][1])}`;
              con.query(update, (err, data) => {
                if (err) throw err;
              });
            }
            res.redirect("/index.html");
          }
        });
      });
    }
    async function checkValid(exFile) {
      let result = true;
      let rows = await readXlsxFile(exFile); // Wait for the file to be read
      rows.shift();
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].length !== 6) {
          result = false;
        } else {
          for (let j = 0; j < rows[i].length; j++) {
            if (rows[i][j] == null) {
              result = false;
            }
          }
        }
      }
      return result;
    }

    let signal = await checkValid(__dirname + "/uploads/" + req.file.filename);
    if (signal) {
      importSales(__dirname + "/uploads/" + req.file.filename);
    } else {
      res.render("importSalesError", { errorMessage: "Error Template Format" });
    }
  }
);

//get cogs
async function getCogs(id) {
  let query = `select invoice_id, purchasePrice, (purchaseUnits - soldUnits) as inventory, soldUnits from invoice where product_id = '${id}' and purchaseUnits - soldUnits > 0 order by invoice_date asc;`;
  return new Promise((resolve) => {
    con.query(query, (err, data) => {
      if (err) throw err;
      return resolve(data);
    });
  });
}

//get vendor
async function getVendor(id) {
  let query = `select vendorName from productInfo where id = ${id}`;
  return new Promise((resolve) => {
    con.query(query, (err, data) => {
      if (err) throw err;
      return resolve(data);
    });
  });
}

//import invoice data
app.post(
  "/import-invoice",
  uploadFile.single("import-excel"),
  async (req, res, next) => {
    function importInvoice(exFile) {
      readXlsxFile(exFile).then((rows) => {
        rows.shift();
        con.connect(async (error) => {
          if (error) {
            console.error(error);
          } else {
            const checkPO = await Query(
              `select id from PO where id = '${rows[0][2]}'`
            );
            if (checkPO.length == 0) {
              res.render("importInvoiceError", {
                errorMessage: "Cannot find PO Number",
              });
            } else {
              let query =
                "INSERT INTO invoice (vendorName, invoice_id, po_id, product_id, purchaseUnits, purchasePrice, invoice_date) VALUES ?";
              con.query(query, [rows], function (err, result) {
                if (err) throw err;
              });
              for (let i = 0; i < rows.length; i++) {
                const updateProductInfo = `UPDATE productInfo SET incoming = incoming - ${Number(
                  rows[i][4]
                )}, totalPurchaseUnits = totalPurchaseUnits + ${Number(
                  rows[i][4]
                )}, totalPurchaseAmount = totalPurchaseAmount + ${
                  Number(rows[i][4]) * Number(rows[i][5])
                } WHERE id = '${Number(rows[i][3])}'`;
                const updatePO = `UPDATE PO SET status = 'received', invoiceID = '${
                  rows[i][1]
                }' WHERE product_id = ${Number(rows[i][3])} AND id = '${
                  rows[i][2]
                }'`;
                con.query(updateProductInfo, (err, result) => {
                  if (err) throw err;
                });
                con.query(updatePO, (err, result) => {
                  if (err) throw err;
                });
              }

              res.redirect("/index.html");
            }
          }
        });
      });
    }
    async function checkValid(exFile) {
      let result = true;
      let rows = await readXlsxFile(exFile); // Wait for the file to be read
      rows.shift();
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].length !== 7) {
          result = false;
        } else {
          for (let j = 0; j < rows[i].length; j++) {
            if (rows[i][j] == null) {
              result = false;
            }
          }
        }
      }
      return result;
    }

    let signal = await checkValid(__dirname + "/uploads/" + req.file.filename);
    if (signal) {
      importInvoice(__dirname + "/uploads/" + req.file.filename);
    } else {
      res.render("importInvoiceError", {
        errorMessage: "Error Template Format",
      });
    }
  }
);

//add to cart
app.post("/addToCart", async (req, res, next) => {
  const data = req.body;
  const id = data.product_id;
  const quantity = data.quantity;
  const cart = data.cart;
  const query = `UPDATE productInfo SET ${cart} = ${quantity} WHERE id = ${id}`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.json({ product_id: id, quantity: quantity });
  });
});

//product filter route
app.get("/product", (req, res, next) => {
  let where = "";

  let min_inventory = req.query.min_inventory;
  if (min_inventory !== "")
    where += `where (totalPurchaseUnits - totalSoldUnits) >= ${Number(
      min_inventory
    )}`;

  let max_inventory = req.query.max_inventory;
  if (max_inventory !== "") {
    if (where.length > 0)
      where += ` and (totalPurchaseUnits - totalSoldUnits) <= ${Number(
        max_inventory
      )}`;
    else
      where += `where (totalPurchaseUnits - totalSoldUnits) <= ${Number(
        max_inventory
      )}`;
  }

  let min_roi = req.query.min_roi;
  if (min_roi !== "") {
    if (where.length > 0)
      where += ` and (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / (totalPurchaseAmount / totalPurchaseUnits + packageCost) >= ${
        Number(min_roi) / 100
      }`;
    else
      where += `where (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / (totalPurchaseAmount / totalPurchaseUnits + packageCost) >= ${
        Number(min_roi) / 100
      }`;
  }

  let max_roi = req.query.max_roi;
  if (max_roi !== "") {
    if (where.length > 0)
      where += ` and (sellPrice - totalPurchaseAmount  / totalPurchaseUnits - packageCost) / (totalPurchaseAmount / totalPurchaseUnits + packageCost) <= ${
        Number(max_roi) / 100
      }`;
    else
      where += `where (sellPrice - totalPurchaseAmount  / totalPurchaseUnits - packageCost) / (totalPurchaseAmount / totalPurchaseUnits + packageCost) <= ${
        Number(max_roi) / 100
      }`;
  }

  let min_margin = req.query.min_margin;
  if (min_margin !== "") {
    if (where.length > 0)
      where += ` and (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / sellPrice >= ${
        Number(min_margin) / 100
      }`;
    else
      where += `where (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / sellPrice >= ${
        Number(min_margin) / 100
      }`;
  }

  let max_margin = req.query.max_margin;
  if (max_margin !== "") {
    if (where.length > 0)
      where += ` and (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / sellPrice >= ${
        Number(max_margin) / 100
      }`;
    else
      where += `where (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / sellPrice <= ${
        Number(max_margin) / 100
      }`;
  }

  let tag = req.query.tag;
  if (tag !== "all") {
    if (where.length > 0) {
      where += ` and (tag1 = '${tag}' or tag2 = '${tag}' or tag3 = '${tag}' or tag4 = '${tag}' or tag5 = '${tag}')`;
    } else {
      where += `where tag1 = '${tag}' or tag2 = '${tag}' or tag3 = '${tag}' or tag4 = '${tag}' or tag5 = '${tag}'`;
    }
  }

  let vendor = req.query.vendorName;
  if (vendor !== "all") {
    if (where.length > 0) where += ` and vendorName = '${vendor}'`;
    else where += `where vendorName = '${vendor}'`;
  }

  let orderBy = ` order by ${req.query.orderBy}`;
  let queryString = where + orderBy;
  const query = `SELECT id, image_url, modelNO, title, vendorName, vendorPrice, incoming, sellPrice, packageNo, packageCost, creationDate, (GMS / totalSoldUnits)AS avgPrice, GMS, totalSoldUnits, totalPurchaseUnits, totalPurchaseAmount,cart1, cart2, cart3, (totalPurchaseUnits - totalSoldUnits) AS inventory, remark, tag1, tag2, tag3, tag4, tag5
    FROM productInfo
    ${queryString}`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("product", { data });
  });
});

//update price
app.post("/priceUpdate", (req, res) => {
  const data = req.body;
  const product_id = data.product_id;
  const price = data.sellPrice;
  const query = `UPDATE productInfo SET sellPrice = ${price} WHERE id = ${product_id}`;

  con.query(query, (err, data) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//searchProduct
app.get("/search", (req, res) => {
  const product = req.query.product;
  const searchBy = req.query.searchBy;
  const query = `SELECT id, image_url, modelNO, title, vendorName, vendorPrice, incoming, sellPrice, packageNo, packageCost, creationDate, (GMS / totalSoldUnits)AS avgPrice, GMS, totalSoldUnits, totalPurchaseUnits, totalPurchaseAmount,cart1, cart2, cart3, (totalPurchaseUnits - totalSoldUnits) AS inventory, remark,
  tag1, tag2, tag3, tag4, tag5 from productInfo where ${searchBy} like '%${product}%'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("product", { data });
  });
});

//dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

//return monthly sales data
app.get("/monthlySales", (req, res) => {
  const query = `SELECT SUM(soldPrice*soldUnits) AS GMS, Month(sales_date) AS Monthly FROM sales GROUP BY Monthly;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

//return product sales chart
app.get("/productChart", (req, res, next) => {
  const product_id = req.query.id;
  const year = req.query.year;
  const query = `SELECT product_id, SUM(soldUnits) as totalSold, AVG(soldPrice)AS price, MONTH(sales_date) AS Monthly FROM sales WHERE product_id = ${product_id} and year(sales_date) = '${year}' GROUP BY product_id, Monthly `;

  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

///cart
app.get("/cart", (req, res) => {
  const query =
    "SELECT SUM(cart1)AS cart1, SUM(cart2)AS cart2, SUM(cart3)AS cart3, SUM(cart1*vendorPrice) AS cart1Amount, SUM(cart2*vendorPrice) AS cart2Amount, SUM(cart3*vendorPrice) AS cart3Amount, vendorName FROM productInfo where cart1 > 0 or cart2 > 0 or cart3 > 0 GROUP BY vendorName ";
  con.query(query, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.render("cart", { result });
  });
});

///shopping cart1
app.get("/shoppingCart1", (req, res) => {
  const vendor = req.query.vendor;
  const cart = req.query.cart;
  const where = `WHERE ${cart} > 0 AND vendorName = '${vendor}'`;
  const query = `SELECT id, image_url, modelNO, title, vendorName, vendorPrice, incoming, sellPrice, packageNo, packageCost, creationDate, (GMS / totalSoldUnits)AS avgPrice, GMS, totalSoldUnits, totalPurchaseUnits, totalPurchaseAmount,cart1, cart2, cart3, (totalPurchaseUnits - totalSoldUnits) AS inventory, remark, tag1, tag2, tag3, tag4, tag5
    FROM productInfo ${where}`;

  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("shoppingCart", { data });
  });
});

///shopping cart2
app.get("/shoppingCart2", (req, res) => {
  const vendor = req.query.vendor;
  const cart = req.query.cart;
  const where = `WHERE ${cart} > 0 AND vendorName = '${vendor}'`;
  const query = `SELECT id, image_url, modelNO, title, vendorName, vendorPrice, incoming, sellPrice, packageNo, packageCost, creationDate, (GMS / totalSoldUnits)AS avgPrice, GMS, totalSoldUnits, totalPurchaseUnits, totalPurchaseAmount,cart1, cart2, cart3, (totalPurchaseUnits - totalSoldUnits) AS inventory, remark, tag1, tag2, tag3, tag4, tag5
    FROM productInfo ${where}`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("shoppingCart2", { data });
  });
});

///shopping cart3
app.get("/shoppingCart3", (req, res) => {
  const vendor = req.query.vendor;
  const cart = req.query.cart;
  const where = `WHERE ${cart} > 0 AND vendorName = '${vendor}'`;
  const query = `SELECT id, image_url, modelNO, title, vendorName, vendorPrice, incoming, sellPrice, packageNo, packageCost, creationDate, (GMS / totalSoldUnits)AS avgPrice, GMS, totalSoldUnits, totalPurchaseUnits, totalPurchaseAmount,cart1, cart2, cart3, (totalPurchaseUnits - totalSoldUnits) AS inventory, remark, tag1, tag2, tag3, tag4, tag5
    FROM productInfo ${where}`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("shoppingCart3", { data });
  });
});

///makepo
app.post("/makePO1", async (req, res, next) => {
  const vendor = req.body.vendor;
  const cart = req.body.cart;
  const poNO = req.body.poNumber;
  const ETA = req.body.ETA;
  const query1 = `SELECT id, ${cart}, vendorPrice, modelNO, vendorName FROM productInfo WHERE ${cart} > 0 AND vendorName = '${vendor}'`;
  const data = await Query(query1);
  for (product of data) {
    const id = product.id;
    const quantity = product.cart1;
    const vendorPrice = product.vendorPrice;
    const modelNo = product.modelNO;
    const vendor = product.vendorName;
    const query2 = `INSERT INTO PO 
        (id, product_id, modelNO, vendorPrice, quantity, vendorName, ETA)
        VALUES
        ('${poNO}', ${id}, '${modelNo}', ${vendorPrice}, ${quantity}, '${vendor}', '${ETA}')`;
    const data2 = await Query2(query2);
  }
  for (product of data) {
    const id = product.id;
    const quantity = product.cart1;
    const query3 = `UPDATE productInfo SET cart1 = 0, incoming = incoming + ${quantity} WHERE id = ${id}`;
    const data3 = await Query2(query3);
  }
  const url = `/poDetail?id=${poNO}`;
  res.redirect(url);
  next();
});

///makepo2
app.post("/makePO2", async (req, res, next) => {
  const vendor = req.body.vendor;
  const cart = req.body.cart;
  const poNO = req.body.poNumber;
  const ETA = req.body.ETA;
  const query1 = `SELECT id, ${cart}, vendorPrice, modelNO, vendorName FROM productInfo WHERE ${cart} > 0 AND vendorName = '${vendor}'`;
  const data = await Query(query1);
  for (product of data) {
    const id = product.id;
    const quantity = product.cart2;
    const vendorPrice = product.vendorPrice;
    const modelNo = product.modelNO;
    const vendor = product.vendorName;
    const query2 = `INSERT INTO PO 
        (id, product_id, modelNO, vendorPrice, quantity, vendorName, ETA)
        VALUES
        ('${poNO}', ${id}, '${modelNo}', ${vendorPrice}, ${quantity}, '${vendor}', '${ETA}')`;
    const data2 = await Query2(query2);
  }
  for (product of data) {
    const id = product.id;
    const quantity = product.cart2;
    const query3 = `UPDATE productInfo SET cart2 = 0, incoming = incoming + ${quantity} WHERE id = ${id}`;
    const data3 = await Query2(query3);
  }
  const url = `/poDetail?id=${poNO}`;
  res.redirect(url);
  next();
});

///makepo3
app.post("/makePO3", async (req, res, next) => {
  const vendor = req.body.vendor;
  const cart = req.body.cart;
  const poNO = req.body.poNumber;
  const ETA = req.body.ETA;
  const query1 = `SELECT id, ${cart}, vendorPrice, modelNO, vendorName FROM productInfo WHERE ${cart} > 0 AND vendorName = '${vendor}'`;
  const data = await Query(query1);
  for (product of data) {
    const id = product.id;
    const quantity = product.cart3;
    const vendorPrice = product.vendorPrice;
    const modelNo = product.modelNO;
    const vendor = product.vendorName;
    const query2 = `INSERT INTO PO 
        (id, product_id, modelNO, vendorPrice, quantity, vendorName, ETA)
        VALUES
        ('${poNO}', ${id}, '${modelNo}', ${vendorPrice}, ${quantity}, '${vendor}', '${ETA}')`;
    const data2 = await Query2(query2);
  }
  for (product of data) {
    const id = product.id;
    const quantity = product.cart3;
    const query3 = `UPDATE productInfo SET cart3 = 0, incoming = incoming + ${quantity} WHERE id = ${id}`;
    const data3 = await Query2(query3);
  }
  const url = `/poDetail?id=${poNO}`;
  res.redirect(url);
  next();
});

async function Query(query) {
  return new Promise((resolve) => {
    con.query(query, (err, data) => {
      if (err) throw err;
      return resolve(data);
    });
  });
}

async function Query2(query) {
  con.query(query, (err, data) => {
    if (err) throw err;
  });
}

app.get("/purchaseOrder", (req, res) => {
  const vendor = req.query.vendorName;
  const status = req.query.status;
  let query;
  if (vendor === "all") {
    query = `select distinct(id), status, date_format(ETA, "%Y/%m/%d") as ETA, vendorName, invoiceID from PO WHERE status = '${status}'`;
  } else {
    query = `select distinct(id), status, date_format(ETA, "%Y/%m/%d") as ETA, vendorName, invoiceID from PO where status = '${status}' and vendorName = '${vendor}'`;
  }
  con.query(query, (err, result) => {
    if (err) throw err;
    else {
      res.render("purchaseOrder", { result });
    }
  });
});

app.get("/poDetail", (req, res) => {
  const id = req.query.id;
  const query = `select *, date_format(ETA, "%Y/%m/%d") as ETA from PO where id = '${id}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    else {
      res.render("poDetail", { result });
    }
  });
});

// for searching po by po number
app.get("/poID", (req, res) => {
  const poNumber = req.query.id;
  const query = `select id from PO where id = '${poNumber}' limit 1`;
  con.query(query, (err, result) => {
    if (err) throw err;
    else {
      res.json(result);
    }
  });
});

app.get("/invoice", (req, res) => {
  const vendor = req.query.vendorName;
  const status = req.query.status;
  let query;
  if (vendor === "all") {
    query = `select distinct(invoice_id), status, vendorName, date_format(invoice_date, "%Y/%m/%d") as date, po_id from invoice WHERE status = '${status}'`;
  } else {
    query = `select distinct(invoice_id), status, vendorName, date_format(invoice_date, "%Y/%m/%d") as date, po_id from invoice where status = '${status}' and vendorName = '${vendor}'`;
  }
  con.query(query, (err, result) => {
    if (err) throw err;
    else {
      res.render("invoice", { result });
    }
  });
});

app.get("/invoiceDetail", (req, res) => {
  const id = req.query.id;
  const query = `select invoice.invoice_id, invoice.vendorName,invoice.po_id, invoice.product_id, invoice.purchaseUnits, invoice.purchasePrice,(invoice.purchaseUnits - invoice.soldUnits)as salesStatus, invoice.status, date_format(invoice_date, "%Y/%m/%d") as date, PO.modelNO, PO.vendorPrice as po_price, PO.quantity as po_quantity from invoice inner join PO where invoice.invoice_id = '${id}' and invoice.po_id = PO.id and invoice.product_id = PO.product_id;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.render("invoiceDetail", { result });
  });
});

//for searching by invoice number
app.get("/invoiceID", (req, res) => {
  const id = req.query.id;
  const query = `select invoice_id from invoice where invoice_id = '${id}' limit 1`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

app.get("/vendorDashboard", (req, res) => {
  res.render("vendorDashboard", { vendor: req.query.vendor });
});

// create tag and view all tags page
app.get("/tag", (req, res) => {
  const query = `select * from tag`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("tag", { data });
  });
});

//check weather the tag is already exists
app.get("/createTag", (req, res) => {
  const tag = req.query.tag;
  const query = `select tagName from tag where tagName = '${tag}'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.status(200).json(data);
  });
});
//create tag route
app.post("/createTag", (req, res) => {
  const tag = req.body.tag;
  const description = req.body.description;
  const query = `INSERT INTO tag (tagName, description) VALUES ('${tag}', '${description}')`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

app.get("/vendorPage", (req, res) => {
  const query = `select * from vendor`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("vendor", { data });
  });
});

app.post("/createVendorInfo", async (req, res) => {
  const vendor = req.body.vendor;
  const contact = req.body.contact;
  const contactEmail = req.body.contactEmail;
  const paymentContact = req.body.paymentContact;
  const paymentEmail = req.body.paymentEmail;
  const salesContact = req.body.salesContact;
  const salesEmail = req.body.salesEmail;
  const address = req.body.address;
  const payment = req.body.payment;

  const checkExist = await Query(
    `select vendorName from vendor where vendorName = '${vendor}'`
  );
  console.log(checkExist);
  if (checkExist.length === 0) {
    const query = `INSERT INTO vendor (vendorName, contact, contactEmail, paymentContact, paymentEmail, salesContact, salesEmail, address, payment) VALUES ('${vendor}', '${contact}', '${contactEmail}', '${paymentContact}', '${paymentEmail}', '${salesContact}', '${salesEmail}', '${address}', '${payment}')`;
    con.query(query, (err, result) => {
      if (err) throw err;
      res.status(200).json(result);
    });
  } else {
    res.status(200).json({ err: "already exists" });
  }
});
/// api point

//get all vendor when we try to filter all products
app.get("/vendor", (req, res) => {
  let query = `SELECT vendorName FROM vendor `;
  con.query(query, (err, data) => {
    if (err) throw err;
    else {
      res.json(data);
    }
  });
});

//get incoming info
app.post("/getIncoming", (req, res) => {
  const id = req.body.id;
  const query = `SELECT id, modelNO, quantity, status, date_format(ETA, "%Y/%m/%d") as ETA, vendorName FROM PO WHERE product_id = ${id} AND status = 'not receive'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.json(data);
  });
});

//save remark
app.post("/remark", (req, res) => {
  const id = Number(req.body.id);
  const msg = req.body.msg;
  const query = `UPDATE productInfo SET remark = "${msg}" WHERE id = ${id}`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//modify productInfo
app.post("/modifyProduct", (req, res) => {
  const vendorPrice = req.body.vendorPrice;
  const packageNo = req.body.packageNo;
  const packageCost = req.body.packageCost;
  const id = req.body.product_id;
  const query = `update productInfo set vendorPrice = ${vendorPrice}, packageNo = '${packageNo}', packageCost = ${Number(
    packageCost
  )} where id = ${id}`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//verify invoice
app.post("/verifyInvoice", (req, res) => {
  const inv = req.body.invoice_id;
  const query = `update invoice set status = 'finished' where invoice_id = '${inv}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//get sales data (query year)
app.get("/salesData", (req, res) => {
  const year = req.query.year;
  const query = `select sum(soldUnits)as totalSoldUnits, sum(soldUnits*soldPrice) as GMS, count(distinct product_id) as SKUCount from sales where year(sales_date) = '${year}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get invoice data (query year)
app.get("/invoiceData", (req, res) => {
  const year = req.query.year;
  const query = `select sum(purchaseUnits) as totalPurchaseUnits, sum(purchaseUnits*purchasePrice) as totalPurchase, count(distinct product_id) as SKUCount from invoice where year(invoice_date) = '${year}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

// get current inventory
app.get("/inventory", (req, res) => {
  const query = `select count(distinct product_id) as SKU, sum(purchaseUnits - soldUnits)as inventory, sum((purchaseUnits - soldUnits) * purchasePrice)
    as inventoryAmount from invoice where purchaseUnits - soldUnits > 0;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get chartdata

app.get("/dbChartSales", (req, res) => {
  const year = req.query.year;
  const query = `select count(distinct product_id) as skuSold, sum(profit) as profit, sum(soldUnits*soldPrice) as GMS, sum(soldUnits) as totalUnits, month(sales_date) as month from sales where year(sales_date) = '${year}' group by month`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

app.get("/dbChartInvoice", (req, res) => {
  const year = req.query.year;
  const query = `select count(distinct product_id) as sku, sum(purchaseUnits) as totalPurchaseQuantity, sum(purchaseUnits*purchasePrice) as totalPurchase, month(invoice_date) as month from invoice where year(invoice_date) = '${year}' group by month;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get sales data (query year)
app.get("/salesDataVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const query = `select sum(soldUnits)as totalSoldUnits, sum(soldUnits*soldPrice) as GMS, count(distinct product_id) as SKUCount from sales where year(sales_date) = '${year}' and vendorName = '${vendor}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get invoice data (query year)

app.get("/invoiceDataVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const query = `select sum(purchaseUnits) as totalPurchaseUnits, sum(purchaseUnits*purchasePrice) as totalPurchase, count(distinct product_id) as SKUCount from invoice where year(invoice_date) = '${year}' and vendorName = '${vendor}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

// get current inventory

app.get("/inventoryVendor", (req, res) => {
  const vendor = req.query.vendor;
  const query = `select count(distinct product_id) as SKU, sum(purchaseUnits - soldUnits)as inventory, sum((purchaseUnits - soldUnits) * purchasePrice)
    as inventoryAmount from invoice where purchaseUnits - soldUnits > 0 and vendorName = '${vendor}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get chartdata

app.get("/dbChartSalesVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const query = `select count(distinct product_id) as skuSold, sum(profit) as profit, sum(soldUnits*soldPrice) as GMS, sum(soldUnits) as totalUnits, month(sales_date) as month from sales where year(sales_date) = '${year}' and vendorName = '${vendor}' group by month`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

app.get("/dbChartInvoiceVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const query = `select count(distinct product_id) as sku, sum(purchaseUnits) as totalPurchaseQuantity, sum(purchaseUnits*purchasePrice) as totalPurchase, month(invoice_date) as month from invoice where year(invoice_date) = '${year}' and vendorName = '${vendor}' group by month;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//taglist
app.get("/taglist", (req, res) => {
  const query = `select tagName from tag`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//update tag to productInfo;

app.put("/updateTag", (req, res) => {
  const tag = req.body.tagName;
  const id = req.body.product_id;
  const index = req.body.index;
  const query = `update productInfo set tag${index} = '${tag}' where id = ${id}`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});
