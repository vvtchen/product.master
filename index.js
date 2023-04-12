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
const InviteUser = require("./invite");

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

/// use function to make validation
const {
  registerValidation,
  loginValidation,
  inviteValidation,
} = require("./auth");

// hash password module
const { genSalt } = require("bcryptjs");
const bcrypt = require("bcryptjs");

//create and assign json web token module
const jwt = require("jsonwebtoken");

//cookie parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

///route

const send = require("./script/sendMail");
app.get("/test", (req, res) => {
  const mailOptions = {
    from: "productmastertest@gmail.com",
    to: "s87041678914@gmail.com",
    subject: "Please verify your email address",
    html: "<a>HTML version of the message</a>",
  };
  send(mailOptions);
  res.send("success");
});
//log out route
app.get("/logout", (req, res) => {
  // Clear the auth-token cookie
  res
    .clearCookie("auth-token")
    .clearCookie("company")
    .clearCookie("permission")
    .clearCookie("user");
  res.status(200).redirect("/login");
});

const nodemailer = require("nodemailer");

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
  const existCompany = await User.findOne({ company: req.body.company });
  if (existCompany) {
    return res.status(400).send("Company name already exists");
  }
  //hash the password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  const verifyToken = jwt.sign(
    { email: req.body.email },
    process.env.Token_Secret,
    { expiresIn: "1d" }
  );
  const user = new User({
    company: req.body.company,
    name: req.body.name,
    email: req.body.email,
    password: hashPassword,
    verifyToken: verifyToken,
  });

  const savedUser = await user.save();
  const url = `${process.env.baseUrl}/verify?token=${verifyToken}`;
  const mailOptions = {
    from: "productmastertest@gmail.com",
    to: `${req.body.email}`,
    subject: "Please verify your email address",
    html: `<a href= ${url}> Click to verify </a>`,
  };
  send(mailOptions);
  res.send("Please verify yout mail");
});

app.get("/verify", async (req, res) => {
  const token = req.query.token;
  const existUser = await User.findOne({ verifyToken: token });
  if (!existUser) {
    return res.send("Error Varify Token");
  }
  existUser.verify = true;
  existUser.verifyToken = null;
  await existUser.save();
  res.send("Your account has been verified");
});

// login

app.get("/forgetPassword", (req, res) => {
  res.render("forgetPassword");
});

app.post("/forgetPassword", async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.send("Invalid Email");
  }
  const token = jwt.sign({ _id: user._id }, process.env.Token_Secret, {
    expiresIn: "1d",
  });

  user.verifyToken = token;
  await user.save();
  const url = `${process.env.baseUrl}/resetPassword?token=${token}`;
  const mailOptions = {
    from: "productmastertest@gmail.com",
    to: `${req.body.email}`,
    subject: "Password Reset",
    html: `<a href= ${url}> Click to reset </a>`,
  };
  send(mailOptions);
  res.send("Password reset link is already sent to your email");
});
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/resetPassword", async (req, res) => {
  const token = req.query.token;
  const existUser = await User.findOne({ verifyToken: token });
  if (!existUser) {
    return res.send("You are not allow to reset password");
  }
  res.render("resetPassword", { token: token });
});

app.post("/resetPassword", async (req, res) => {
  const token = req.query.token;
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  const existUser = await User.findOne({ verifyToken: token });
  if (!existUser) {
    return res.send("You are not allow to reset password");
  }
  existUser.password = hashPassword;
  existUser.verifyToken = null;
  await existUser.save();
  res.send("Password changed!");
});

app.post("/login", async (req, res, next) => {
  //validate
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  //find user in database

  const existUser = await User.findOne({ email: req.body.email, verify: true });
  if (!existUser) {
    return res.status(400).send("Email or Password is wrong");
  }

  //compare the password with hashpassword
  const hashPassword = await bcrypt.compare(
    req.body.password,
    existUser.password
  );
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
    .cookie("user", existUser.name, {
      httpOnly: true,
      secure: true,
      expires: expirationTime,
    })
    .cookie("company", existUser.company, {
      httpOnly: true,
      secure: true,
      expires: expirationTime,
    });
  return res.redirect("/index.html");
});

/// verify token middleware
const auth = require("./token");
app.use(
  auth.unless({
    path: ["/login.css"],
  })
);

// static method allow as to static all files under the filename
app.use(express.static("public"));
app.use("/script", express.static(path.join(__dirname, "/script")));

const { Template } = require("ejs");
const { result } = require("@hapi/joi/lib/base");
const { url } = require("inspector");

//Company
app.get("/account", async (req, res) => {
  const users = await User.find({ company: req.cookies["company"] });
  const user = await User.findOne({ name: req.cookies["user"] });
  res.render("company", { users, user });
});

//invite user to company
app.post("/registerUser", async (req, res, next) => {
  const { error } = inviteValidation(req.body);
  if (error) {
    return res.status(400).json({ err: error.details[0].message });
  }
  const company = req.cookies["company"];
  const isAdmin = await User.findOne({
    name: req.cookies["user"],
    company: company,
    permission: "Admin",
  });
  console.log(isAdmin);
  if (!isAdmin) {
    return res.status(400).json({ err: "Only admin can add user" });
  } else {
    const check = await User.findOne({ email: req.body.email });
    if (check) {
      return res.status(200).json({ err: "Email already existed" });
    }

    const token = jwt.sign(
      { email: req.body.email },
      process.env.Token_Secret,
      {
        expiresIn: "1d",
      }
    );

    const invite = new InviteUser({
      email: req.body.email,
      company: company,
      verifyToken: token,
    });
    const savedInvite = await invite.save();
    const url = `${process.env.baseUrl}/invite?token=${token}`;
    const mailOptions = {
      from: "productmastertest@gmail.com",
      to: `${req.body.email}`,
      subject: `You are invited to Product Master by ${company}`,
      html: `<a href= ${url}> Click to set up your account </a>`,
    };
    send(mailOptions);
    res
      .status(200)
      .json({ msg: `Invitation has been sent to ${req.body.email}` });
  }
});

app.get("/invite", async (req, res) => {
  const token = req.query.token;
  const user = await InviteUser.findOne({ verifyToken: token });
  if (!user) {
    return res.send("You are not invited by the Administrator");
  } else {
    user.verifyToken = null;
    await user.save();
    res.render("invite", { user });
  }
});

app.post("/inviteRegister", async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const exist = await User.findOne({ email: req.body.email });
  if (exist) {
    return res.status(400).send("Email already exists");
  }
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    company: req.body.company,
    name: req.body.name,
    email: req.body.email,
    password: hashPassword,
    verify: true,
    permission: "User",
  });

  const savedUser = await user.save();
  res.send(
    `Welcome, ${req.body.name}. You are now allowed to enter product master`
  );
});

//import products info by templates
app.post(
  "/import-excel",
  uploadFile.single("import-excel"),
  async (req, res, next) => {
    function importFileToDb(exFile) {
      readXlsxFile(exFile).then(async (rows) => {
        rows.shift();
        if (rows.length == 0) {
          return res.render("importProductError", {
            errorMessage: "Can't find any data",
          });
        }

        const checkExist = await Query(
          `Select vendorName from vendor where vendorName = '${rows[0][0]}'`
        );
        if (checkExist.length === 0) {
          return res.render("importProductError", {
            errorMessage: "Can't find vendor with this name",
          });
        }
        const company = req.cookies["company"];
        for (let row of rows) {
          row.push(company);
        }
        let query =
          "INSERT INTO productInfo (vendorName, title, modelNO, vendorPrice, sellPrice, packageNo, packageCost, image_url, company) VALUES ?";
        con.query(query, [rows], function (err, result) {
          if (err) {
            throw err;
          }
          return res.render("productImport", {
            msg: `Created ${result.affectedRows} Products`,
          });
        });
      });
    }
    async function checkValid(exFile) {
      let result = true;
      let rows = await readXlsxFile(exFile);
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
      fs.unlink(__dirname + "/uploads/" + req.file.filename, (err) => {
        console.log(err);
      });
    } else {
      fs.unlink(__dirname + "/uploads/" + req.file.filename, (err) => {
        console.log(err);
      });
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
        if (rows.length == 0) {
          return res.render("importProductError", {
            errorMessage: "Can't find any data",
          });
        }
        const company = req.cookies["company"];
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
              const update = `update invoice set soldUnits = soldUnits + ${quantity}, profit = profit + ${
                quantity * row[3]
              } where invoice_id = '${
                result.invoice_id
              }' and product_id = '${id}'`;
              con.query(update, (err, data) => {
                if (err) throw err;
              });
              break;
            } else {
              cogs += result.inventory * result.purchasePrice;
              const update = `update invoice set soldUnits = soldUnits + ${
                result.inventory
              }, profit = profit + ${
                result.inventory * row[3]
              } where invoice_id = '${
                result.invoice_id
              }' and product_id = '${id}'`;
              con.query(update, (err, data) => {
                if (err) throw err;
              });
              quantity -= result.inventory;
            }
          }
          row.push(vendor[0].vendorName);
          row.push(company);
        }
        con.connect((error) => {
          if (error) {
            console.error(error);
          } else {
            let query = `INSERT INTO sales (sales_id, product_id, title, soldPrice, soldUnits, sales_date, profit, vendorName, company) VALUES ?`;
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
      fs.unlink(__dirname + "/uploads/" + req.file.filename, (err) => {
        console.log(err);
      });
    } else {
      fs.unlink(__dirname + "/uploads/" + req.file.filename, (err) => {
        console.log(err);
      });
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
        if (rows.length == 0) {
          return res.render("importProductError", {
            errorMessage: "Can't find any data",
          });
        }
        con.connect(async (error) => {
          if (error) {
            console.error(error);
          } else {
            const company = req.cookies["company"];
            const checkPO = await Query(
              `select id from PO where id = '${rows[0][2]}' and vendorName = '${rows[0][0]}' and company = '${company}'`
            );
            if (checkPO.length == 0) {
              res.render("importInvoiceError", {
                errorMessage: "Cannot find PO Number",
              });
            } else {
              for (let row of rows) {
                row.push(company);
              }
              let query =
                "INSERT INTO invoice (vendorName, invoice_id, po_id, product_id, purchaseUnits, purchasePrice, invoice_date, company) VALUES ?";
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
      fs.unlink(__dirname + "/uploads/" + req.file.filename, (err) => {
        console.log(err);
      });
    } else {
      fs.unlink(__dirname + "/uploads/" + req.file.filename, (err) => {
        console.log(err);
      });
      res.render("importInvoiceError", {
        errorMessage: "Error Template Format",
      });
    }
  }
);

//add to cart
app.put("/addToCart", (req, res) => {
  const data = req.body;
  const id = data.product_id;
  const quantity = data.quantity;
  const cart = data.cart;
  const company = req.cookies["company"];
  const query = `UPDATE productInfo SET ${cart} = ${quantity} WHERE id = ${id} and company = '${company}'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.json({ product_id: id, quantity: quantity });
  });
});

//product filter route
app.get("/product", (req, res, next) => {
  let where = "";

  let sales_from = req.query.date_from;
  let sales_end = req.query.date_end;

  if (sales_from || sales_end) {
    if (sales_from !== "") {
      where += ` where sales.sales_date >= '${sales_from}'`;
    }

    if (sales_end !== "") {
      if (where.length > 0) {
        where += ` and sales.sales_date <= '${sales_end}'`;
      } else {
        where += ` where sales.sales_date <= '${sales_end}'`;
      }
    }
    let min_inventory = req.query.min_inventory;
    if (min_inventory !== "")
      where += `and (totalPurchaseUnits - totalSoldUnits) >= ${Number(
        min_inventory
      )}`;

    let max_inventory = req.query.max_inventory;
    if (max_inventory !== "") {
      if (where.length > 0)
        where += ` and (totalPurchaseUnits - totalSoldUnits) <= ${Number(
          max_inventory
        )}`;
    }

    let min_roi = req.query.min_roi;
    if (min_roi !== "") {
      if (where.length > 0)
        where += ` and (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / (totalPurchaseAmount / totalPurchaseUnits + packageCost) >= ${
          Number(min_roi) / 100
        }`;
    }

    let max_roi = req.query.max_roi;
    if (max_roi !== "") {
      if (where.length > 0)
        where += ` and (sellPrice - totalPurchaseAmount  / totalPurchaseUnits - packageCost) / (totalPurchaseAmount / totalPurchaseUnits + packageCost) <= ${
          Number(max_roi) / 100
        }`;
    }

    let min_margin = req.query.min_margin;
    if (min_margin !== "") {
      if (where.length > 0)
        where += ` and (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / sellPrice >= ${
          Number(min_margin) / 100
        }`;
    }

    let max_margin = req.query.max_margin;
    if (max_margin !== "") {
      if (where.length > 0)
        where += ` and (sellPrice - totalPurchaseAmount / totalPurchaseUnits - packageCost) / sellPrice >= ${
          Number(max_margin) / 100
        }`;
    }

    let tag = req.query.tag;
    if (tag !== "all") {
      if (where.length > 0) {
        where += ` and (tag1 = '${tag}' or tag2 = '${tag}' or tag3 = '${tag}' or tag4 = '${tag}' or tag5 = '${tag}')`;
      }
    }

    let vendor = req.query.vendorName;
    if (vendor !== "all") {
      if (where.length > 0) where += ` and vendorName = '${vendor}'`;
    }

    if (where.length > 0) {
      where += ` and company = '${req.cookies["company"]}'`;
    } else {
      where += ` where company = '${req.cookies["company"]}'`;
    }

    let orderBy = ` order by ${req.query.orderBy}`;
    let queryString = where + orderBy;

    const query = `select sales.product_id as id, productInfo.image_url, productInfo.modelNO, productInfo.title, productInfo.vendorName, productInfo.vendorPrice, productInfo.incoming, productInfo.sellPrice, productInfo.packageNo, productInfo.packageCost, productInfo.creationDate, (productInfo.GMS / productInfo.totalSoldUnits)AS avgPrice, productInfo.GMS, productInfo.totalSoldUnits, productInfo.totalPurchaseUnits, productInfo.totalPurchaseAmount,productInfo.cart1, productInfo.cart2, productInfo.cart3, (productInfo.totalPurchaseUnits - productInfo.totalSoldUnits) AS inventory, productInfo.remark, productInfo.tag1, productInfo.tag2, productInfo.tag3, productInfo.tag4, productInfo.tag5 from sales inner join productInfo on sales.product_id = productInfo.id ${queryString}`;
    con.query(query, (err, data) => {
      if (err) throw err;
      res.render("product", { data });
    });
  } else {
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
    if (where.length > 0) {
      where += ` and company = '${req.cookies["company"]}'`;
    } else {
      where += ` where company = '${req.cookies["company"]}'`;
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
  }
});

//update price
app.put("/priceUpdate", (req, res) => {
  const data = req.body;
  const product_id = data.product_id;
  const price = data.sellPrice;
  const company = req.cookies["company"];
  const query = `UPDATE productInfo SET sellPrice = ${price} WHERE id = ${product_id} and company = '${company}'`;

  con.query(query, (err, data) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//searchProduct
app.get("/search", (req, res) => {
  const product = req.query.product;
  const company = req.cookies["company"];
  const query = `SELECT id, image_url, modelNO, title, vendorName, vendorPrice, incoming, sellPrice, packageNo, packageCost, creationDate, (GMS / totalSoldUnits)AS avgPrice, GMS, totalSoldUnits, totalPurchaseUnits, totalPurchaseAmount,cart1, cart2, cart3, (totalPurchaseUnits - totalSoldUnits) AS inventory, remark,
  tag1, tag2, tag3, tag4, tag5 from productInfo where (title like '%${product}%' or id like '${product}%') and company = '${company}'`;
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
  const company = req.cookies["company"];
  const query = `SELECT SUM(cart1)AS cart1, SUM(cart2)AS cart2, SUM(cart3)AS cart3, SUM(cart1*vendorPrice) AS cart1Amount, SUM(cart2*vendorPrice) AS cart2Amount, SUM(cart3*vendorPrice) AS cart3Amount, vendorName FROM productInfo where (cart1 > 0 or cart2 > 0 or cart3 > 0) and company = '${company}' GROUP BY vendorName `;
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
  const company = req.cookies["company"];
  const where = `WHERE ${cart} > 0 AND vendorName = '${vendor}' and company = '${company}'`;
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
  const company = req.cookies["company"];
  const where = `WHERE ${cart} > 0 AND vendorName = '${vendor}' and company = '${company}'`;
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
  const company = req.cookies["company"];
  const where = `WHERE ${cart} > 0 AND vendorName = '${vendor}' and company = '${company}'`;
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
  const company = req.cookies["company"];
  const query1 = `SELECT id, ${cart}, vendorPrice, modelNO, vendorName FROM productInfo WHERE ${cart} > 0 AND vendorName = '${vendor}' and company = '${company}'`;
  const data = await Query(query1);
  for (product of data) {
    const id = product.id;
    const quantity = product.cart1;
    const vendorPrice = product.vendorPrice;
    const modelNo = product.modelNO;
    const vendor = product.vendorName;
    const query2 = `INSERT INTO PO 
        (id, product_id, modelNO, vendorPrice, quantity, vendorName, ETA, company)
        VALUES
        ('${poNO}', ${id}, '${modelNo}', ${vendorPrice}, ${quantity}, '${vendor}', '${ETA}', '${company}')`;
    const data2 = await Query2(query2);
  }
  for (product of data) {
    const id = product.id;
    const quantity = product.cart1;
    const query3 = `UPDATE productInfo SET cart1 = 0, incoming = incoming + ${quantity} WHERE id = ${id} and company = '${company}'`;
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
  const company = req.cookies["company"];
  const query1 = `SELECT id, ${cart}, vendorPrice, modelNO, vendorName FROM productInfo WHERE ${cart} > 0 AND vendorName = '${vendor}' and company = '${company}'`;
  const data = await Query(query1);
  for (product of data) {
    const id = product.id;
    const quantity = product.cart2;
    const vendorPrice = product.vendorPrice;
    const modelNo = product.modelNO;
    const vendor = product.vendorName;
    const query2 = `INSERT INTO PO 
        (id, product_id, modelNO, vendorPrice, quantity, vendorName, ETA, company)
        VALUES
        ('${poNO}', ${id}, '${modelNo}', ${vendorPrice}, ${quantity}, '${vendor}', '${ETA}', '${company}')`;
    const data2 = await Query2(query2);
  }
  for (product of data) {
    const id = product.id;
    const quantity = product.cart2;
    const query3 = `UPDATE productInfo SET cart2 = 0, incoming = incoming + ${quantity} WHERE id = ${id} and company = '${company}'`;
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
  const company = req.cookies["company"];
  const query1 = `SELECT id, ${cart}, vendorPrice, modelNO, vendorName FROM productInfo WHERE ${cart} > 0 AND vendorName = '${vendor}' and company = '${company}'`;
  const data = await Query(query1);
  for (product of data) {
    const id = product.id;
    const quantity = product.cart3;
    const vendorPrice = product.vendorPrice;
    const modelNo = product.modelNO;
    const vendor = product.vendorName;
    const query2 = `INSERT INTO PO 
        (id, product_id, modelNO, vendorPrice, quantity, vendorName, ETA, company)
        VALUES
        ('${poNO}', ${id}, '${modelNo}', ${vendorPrice}, ${quantity}, '${vendor}', '${ETA}', '${company}')`;
    const data2 = await Query2(query2);
  }
  for (product of data) {
    const id = product.id;
    const quantity = product.cart3;
    const query3 = `UPDATE productInfo SET cart3 = 0, incoming = incoming + ${quantity} WHERE id = ${id} and company = '${company}'`;
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
  const company = req.cookies["company"];
  let query;
  if (vendor === "all") {
    query = `select distinct(id), status, date_format(ETA, "%Y/%m/%d") as ETA, vendorName, invoiceID from PO WHERE status = '${status}' and company = '${company}'`;
  } else {
    query = `select distinct(id), status, date_format(ETA, "%Y/%m/%d") as ETA, vendorName, invoiceID from PO where status = '${status}' and vendorName = '${vendor}' and company = '${company}'`;
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
  const company = req.cookies["company"];
  const query = `select *, date_format(ETA, "%Y/%m/%d") as ETA from PO where id = '${id}' and company = '${company}'`;
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
  const company = req.cookies["company"];
  const query = `select id from PO where id = '${poNumber}' and company = '${company}' limit 1`;
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
  const company = req.cookies["company"];
  let query;
  if (vendor === "all") {
    query = `select distinct(invoice_id), status, vendorName, date_format(invoice_date, "%Y/%m/%d") as date, po_id from invoice WHERE status = '${status}' and company = '${company}'`;
  } else {
    query = `select distinct(invoice_id), status, vendorName, date_format(invoice_date, "%Y/%m/%d") as date, po_id from invoice where status = '${status}' and vendorName = '${vendor}' and company = '${company}'`;
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
  const company = req.cookies["company"];
  const query = `select invoice.invoice_id, invoice.vendorName,invoice.po_id, invoice.product_id, invoice.purchaseUnits, invoice.purchasePrice,(invoice.purchaseUnits - invoice.soldUnits)as salesStatus, invoice.status, date_format(invoice_date, "%Y/%m/%d") as date, (invoice.profit - invoice.purchaseUnits*invoice.purchasePrice) as profit, PO.modelNO, PO.vendorPrice as po_price, PO.quantity as po_quantity from invoice inner join PO where invoice.invoice_id = '${id}' and invoice.company = '${company}' and invoice.po_id = PO.id and invoice.product_id = PO.product_id;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.render("invoiceDetail", { result });
  });
});

//for searching by invoice number
app.get("/invoiceID", (req, res) => {
  const id = req.query.id;
  const company = req.cookies["company"];
  const query = `select invoice_id from invoice where invoice_id = '${id}' and company = '${company}' limit 1`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

/// need to check
app.get("/vendorDashboard", (req, res) => {
  res.render("vendorDashboard", { vendor: req.query.vendor });
});

// create tag and view all tags page
app.get("/tag", (req, res) => {
  const company = req.cookies["company"];
  const query = `select * from tag where company = '${company}'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.render("tag", { data });
  });
});

//check weather the tag is already exists
app.get("/createTag", (req, res) => {
  const tag = req.query.tag;
  const company = req.cookies["company"];
  const query = `select tagName from tag where tagName = '${tag}' and company = '${company}'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.status(200).json(data);
  });
});
//create tag route
app.post("/createTag", (req, res) => {
  const tag = req.body.tag;
  const description = req.body.description;
  const company = req.cookies["company"];
  const query = `INSERT INTO tag (tagName, description, company) VALUES ('${tag}', '${description}', '${company}')`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

app.get("/vendorPage", (req, res) => {
  const query = `select * from vendor where company = '${req.cookies["company"]}'`;
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
  const company = req.cookies["company"];

  const checkExist = await Query(
    `select vendorName from vendor where vendorName = '${vendor}' and company = '${company}'`
  );
  console.log(checkExist);
  if (checkExist.length === 0) {
    const query = `INSERT INTO vendor (vendorName, contact, contactEmail, paymentContact, paymentEmail, salesContact, salesEmail, address, payment, company) VALUES ('${vendor}', '${contact}', '${contactEmail}', '${paymentContact}', '${paymentEmail}', '${salesContact}', '${salesEmail}', '${address}', '${payment}', '${company}')`;
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
  let query = `SELECT vendorName FROM vendor where company = '${req.cookies["company"]}'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    else {
      res.json(data);
    }
  });
});

//get incoming info
app.get("/getIncoming", (req, res) => {
  const id = req.query.id;
  const company = req.cookies["company"];
  const query = `SELECT id, modelNO, quantity, status, date_format(ETA, "%Y/%m/%d") as ETA, vendorName FROM PO WHERE product_id = ${id} AND status = 'not receive' and company = '${company}'`;
  con.query(query, (err, data) => {
    if (err) throw err;
    res.json(data);
  });
});

//save remark
app.post("/remark", (req, res) => {
  const id = Number(req.body.id);
  const msg = req.body.msg;
  const company = req.cookies["company"];
  const query = `UPDATE productInfo SET remark = "${msg}" WHERE id = ${id} and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//modify productInfo
app.put("/modifyProduct", (req, res) => {
  const vendorPrice = req.body.vendorPrice;
  const packageNo = req.body.packageNo;
  const packageCost = req.body.packageCost;
  const id = req.body.product_id;
  const company = req.cookies["company"];
  const query = `update productInfo set vendorPrice = ${vendorPrice}, packageNo = '${packageNo}', packageCost = ${Number(
    packageCost
  )} where id = ${id} and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//verify invoice
app.put("/verifyInvoice", (req, res) => {
  const inv = req.body.invoice_id;
  const company = req.cookies["company"];
  const query = `update invoice set status = 'finished' where invoice_id = '${inv}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

//get sales data (query year)
app.get("/salesData", (req, res) => {
  const year = req.query.year;
  const company = req.cookies["company"];
  const query = `select sum(soldUnits)as totalSoldUnits, sum(soldUnits*soldPrice) as GMS, count(distinct product_id) as SKUCount from sales where year(sales_date) = '${year}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get invoice data (query year)
app.get("/invoiceData", (req, res) => {
  const year = req.query.year;
  const company = req.cookies["company"];
  const query = `select sum(purchaseUnits) as totalPurchaseUnits, sum(purchaseUnits*purchasePrice) as totalPurchase, count(distinct product_id) as SKUCount from invoice where year(invoice_date) = '${year}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

// get current inventory
app.get("/inventory", (req, res) => {
  const company = req.cookies["company"];
  const query = `select count(distinct product_id) as SKU, sum(purchaseUnits - soldUnits)as inventory, sum((purchaseUnits - soldUnits) * purchasePrice)
    as inventoryAmount from invoice where purchaseUnits - soldUnits > 0 and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get chartdata

app.get("/dbChartSales", (req, res) => {
  const year = req.query.year;
  const company = req.cookies["company"];
  const query = `select count(distinct product_id) as skuSold, sum(profit) as profit, sum(soldUnits*soldPrice) as GMS, sum(soldUnits) as totalUnits, month(sales_date) as month from sales where year(sales_date) = '${year}' and company = '${company}' group by month`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

app.get("/dbChartInvoice", (req, res) => {
  const year = req.query.year;
  const company = req.cookies["company"];
  const query = `select count(distinct product_id) as sku, sum(purchaseUnits) as totalPurchaseQuantity, sum(purchaseUnits*purchasePrice) as totalPurchase, month(invoice_date) as month from invoice where year(invoice_date) = '${year}' and company = '${company}' group by month;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get sales data (query year)
app.get("/salesDataVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const company = req.cookies["company"];
  const query = `select sum(soldUnits)as totalSoldUnits, sum(soldUnits*soldPrice) as GMS, count(distinct product_id) as SKUCount from sales where year(sales_date) = '${year}' and vendorName = '${vendor}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get invoice data (query year)

app.get("/invoiceDataVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const company = req.cookies["company"];
  const query = `select sum(purchaseUnits) as totalPurchaseUnits, sum(purchaseUnits*purchasePrice) as totalPurchase, count(distinct product_id) as SKUCount from invoice where year(invoice_date) = '${year}' and vendorName = '${vendor}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

// get current inventory

app.get("/inventoryVendor", (req, res) => {
  const vendor = req.query.vendor;
  const company = req.cookies["company"];
  const query = `select count(distinct product_id) as SKU, sum(purchaseUnits - soldUnits)as inventory, sum((purchaseUnits - soldUnits) * purchasePrice)
    as inventoryAmount from invoice where purchaseUnits - soldUnits > 0 and vendorName = '${vendor}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//get chartdata

app.get("/dbChartSalesVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const company = req.cookies["company"];
  const query = `select count(distinct product_id) as skuSold, sum(profit) as profit, sum(soldUnits*soldPrice) as GMS, sum(soldUnits) as totalUnits, month(sales_date) as month from sales where year(sales_date) = '${year}' and vendorName = '${vendor}' and company = '${company}' group by month`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

app.get("/dbChartInvoiceVendor", (req, res) => {
  const year = req.query.year;
  const vendor = req.query.vendor;
  const company = req.cookies["company"];
  const query = `select count(distinct product_id) as sku, sum(purchaseUnits) as totalPurchaseQuantity, sum(purchaseUnits*purchasePrice) as totalPurchase, month(invoice_date) as month from invoice where year(invoice_date) = '${year}' and vendorName = '${vendor}' and company = '${company}' group by month;`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

//taglist
app.get("/taglist", (req, res) => {
  const query = `select tagName from tag where company = '${req.cookies["company"]}'`;
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
  const company = req.cookies["company"];
  const query = `update productInfo set tag${index} = '${tag}' where id = ${id} and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

app.get("/vendorInfo", (req, res) => {
  const vendor = req.query.vendor;
  const company = req.cookies["company"];
  const query = `select * from vendor where vendorName = '${vendor}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

app.get("/topProduct", (req, res) => {
  const vendor = req.query.vendor;
  const company = req.cookies["company"];
  const query = `select product_id, sum(soldPrice*soldUnits) as gms, SUM(profit)/(SUM(soldPrice*soldUnits)) AS margin from sales  where vendorName = "${vendor}" and company = '${company}' group by product_id order by sum(soldPrice*soldUnits) desc limit 10
  `;
  con.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

app.get("/download", (req, res) => {
  const fileName = req.query.file;
  res.download(__dirname + `/public/${fileName}`);
});

app.put("/adjustQ", (req, res) => {
  const id = req.body.id;
  const po = req.body.po_id;
  const diff = req.body.diff;
  const company = req.cookies["company"];
  const query = `Update productInfo set incoming = incoming + ${Number(
    diff
  )} where id = '${id}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
  });

  const query2 = `Update PO set quantity = quantity + ${Number(
    diff
  )} where product_id = '${id}' and company = '${company}'`;
  con.query(query2, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});

app.put("/adjustP", (req, res) => {
  const id = req.body.id;
  const po = req.body.po_id;
  const diff = req.body.diff;
  const company = req.cookies["company"];
  const query = `Update productInfo set vendorPrice = vendorPrice + ${Number(
    diff
  )} where id = '${id}' and company = '${company}'`;
  con.query(query, (err, result) => {
    if (err) throw err;
  });

  const query2 = `Update PO set vendorPrice = vendorPrice + ${Number(
    diff
  )} where product_id = '${id}' and company = '${company}'`;
  con.query(query2, (err, result) => {
    if (err) throw err;
    res.status(200).send();
  });
});
