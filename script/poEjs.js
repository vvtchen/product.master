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
