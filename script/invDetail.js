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
