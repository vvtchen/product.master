async function verify(ele) {
  const inv = ele.value;
  const data = { invoice_id: inv };
  await fetch("/verifyInvoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  ele.style = "background-color: #2564cf; color: white;";
}
function count() {
  const row = document.getElementsByClassName("rowData");
  const quantity = document.getElementsByClassName("quantity");
  const price = document.getElementsByClassName("price");
  let amount = 0;
  let units = 0;
  for (let i = 0; i < price.length; i++) {
    let sum = Number(price[i].innerHTML) * Number(quantity[i].innerHTML);
    amount += sum;
    let unit = Number(quantity[i].innerHTML);
    units += unit;
  }
  document.getElementById("sku").innerHTML = row.length;
  document.getElementById("quantity").innerHTML = units;
  document.getElementById("amount").innerHTML = `$${amount}`;
}
count();

const filter = (ele) => {
  const inventory = document.getElementsByClassName("inventory");
  if (ele.id == "hide") {
    for (let product of inventory) {
      const units = Number(product.textContent);
      const row = product.closest("tr");
      if (units === 0) {
        row.style.display = "none";
      }
    }
    ele.id = "show";
    ele.textContent = "Show All";
  } else if (ele.id == "show") {
    for (let product of inventory) {
      const units = Number(product.textContent);
      const row = product.closest("tr");
      if (units === 0) {
        row.style.display = "table-row";
      }
    }
    ele.id = "hide";
    ele.textContent = "Only show on hand";
  }
};

const alert = () => {
  const units = document.getElementsByClassName("unitsDiff");
  const price = document.getElementsByClassName("priceDiff");
  for (let unit of units) {
    if (Number(unit.textContent) != 0) {
      unit.style.color = "red";
    }
  }
  for (let p of price) {
    if (Number(p.textContent) > 0) {
      p.style.color = "red";
    }
  }
};

alert();

const totalProfit = () => {
  const total = document.getElementsByClassName("profit");
  var profit = 0;
  for (let i of total) {
    profit += Number(i.textContent.slice(1));
  }
  document.getElementById("profit").innerHTML = `$${profit}`;
  if (profit < 0) {
    document.getElementById("profit").style.color = "red";
  } else if (profit > 0) {
    document.getElementById("profit").style.color = "green";
  }
};

totalProfit();
