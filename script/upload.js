const uploadProdcut = document.getElementById("uploadProductButton");
uploadProdcut.addEventListener("click", product);
const uploadSales = document.getElementById("uploadSalesButton");
uploadSales.addEventListener("click", sales);
const uploadInvoice = document.getElementById("uploadInvoiceButton");
uploadInvoice.addEventListener("click", invoice);

async function product() {
  const msg = document.getElementById("productMsg");
  const inputFile = document.getElementById("inputProductFile");
  const file = inputFile.files[0];
  const reader = new FileReader();
  if (!file) {
    msg.style.color = "red";
    return (msg.textContent = "File not found");
  }
  reader.onload = async function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    const nonNullData = json.filter((row) => row.some((cell) => cell !== ""));
    nonNullData.shift();

    const valid = check(nonNullData, 8);
    if (!valid) {
      msg.textContent = "Error template format";
    } else {
      const response = await fetch("/uploadProduct", {
        method: "POST",
        body: JSON.stringify({ data: nonNullData }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (result.error) {
        msg.textContent = result.error;
        msg.style.color = "red";
      } else if (result.success) {
        msg.textContent = result.success;
        msg.style.color = "green";
      } else {
        msg.textContent = "Something went wrong, please check again later";
        msg.style.color = "red";
      }
    }
  };
  reader.readAsArrayBuffer(file);
}

async function sales() {
  const msg = document.getElementById("salesMsg");
  const inputFile = document.getElementById("inputSalesFile");
  const date = document.getElementById("salesDate").value;
  const file = inputFile.files[0];
  if (!date || !file) {
    msg.style.color = "red";
    return (msg.textContent = "Date and file not found");
  }
  const reader = new FileReader();
  reader.onload = async function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    const nonNullData = json.filter((row) => row.some((cell) => cell !== ""));
    nonNullData.shift();

    for (let ele of nonNullData) {
      ele.push(date);
    }

    const valid = check(nonNullData, 6);
    if (!valid) {
      msg.textContent = "Error template format";
    } else {
      const response = await fetch("/uploadSales", {
        method: "POST",
        body: JSON.stringify({ data: nonNullData }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (result.error) {
        msg.textContent = result.error;
        msg.style.color = "red";
      } else if (result.success) {
        msg.textContent = result.success;
        msg.style.color = "green";
      } else {
        msg.textContent = "Something went wrong, please check again later";
        msg.style.color = "red";
      }
    }
  };
  reader.readAsArrayBuffer(file);
}

async function invoice() {
  const msg = document.getElementById("invoiceMsg");
  const inputFile = document.getElementById("inputInvoiceFile");
  const date = document.getElementById("invoiceDate").value;
  const file = inputFile.files[0];
  if (!date || !file) {
    msg.style.color = "red";
    return (msg.textContent = "Date and file can not be empty");
  }
  const reader = new FileReader();
  reader.onload = async function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    const nonNullData = json.filter((row) => row.some((cell) => cell !== ""));
    nonNullData.shift();
    for (let ele of nonNullData) {
      ele.push(date);
    }
    const response = await fetch("/uploadInvoice", {
      method: "POST",
      body: JSON.stringify({ data: nonNullData }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (result.error) {
      msg.textContent = result.error;
      msg.style.color = "red";
    } else if (result.success) {
      msg.textContent = result.success;
      msg.style.color = "green";
    } else if (result.errorID) {
      msg.textContent = `Can't find product id ${result.errorID} in the corresponding purchase order`;
      msg.style.color = "red";
    } else {
      msg.textContent = "Something went wrong, please check again later";
      msg.style.color = "red";
    }
  };
  reader.readAsArrayBuffer(file);
}

var check = (arr, n) => {
  if (arr.length == 0) return false;
  for (let row of arr) {
    if (row.length !== n) {
      return false;
    } else {
      for (let ele of row) {
        if (!ele) {
          return false;
        }
      }
    }
  }
  return true;
};
