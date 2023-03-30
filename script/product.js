chartBtn = () => {
  const btns = document.getElementsByClassName("chartBtn");
  for (let btn of btns) {
    btn.click();
  }
};
chartBtn();
async function removeTag(ele) {
  const string = ele.id;
  const index = string.slice(3, 4);
  const id = string.slice(4);
  document.getElementById(`tagMsg${id}`).style.display = "none";
  const data = { product_id: id, index: index, tagName: "" };
  console.log(data);
  await fetch("/updateTag", {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  ele.textContent = "";
  ele.style.display = "none";
}
async function addTag(ele) {
  const curTag = document.getElementsByClassName(`tag${ele.value}`);
  let index = 6;
  for (let i = 0; i < curTag.length; i++) {
    if (curTag[i].textContent == "") {
      index = i + 1;
      break;
    }
  }
  if (index > 5) {
    document.getElementById(`tagMsg${ele.value}`).style.display = "inline";
    return;
  }
  const select = document.getElementById(`tagOptions${ele.value}`);
  const tag = select.options[select.selectedIndex].textContent;
  const productId = ele.value;
  const data = { product_id: productId, tagName: tag, index: index };
  await fetch("/updateTag", {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  document.getElementById(`tag${index}${ele.value}`).textContent = tag;
  document.getElementById(`tag${index}${ele.value}`).style.display = "inline";
}

async function getTag() {
  const response = await fetch("/taglist");
  const options = document.getElementsByClassName("tagOptions");
  const lists = await response.json();
  for (let select of options) {
    for (let tag of lists) {
      const option = document.createElement("option");
      option.textContent = tag.tagName;
      select.append(option);
    }
  }
}
getTag();
function tagHide() {
  const tags = document.querySelectorAll('button[class^="tag"]');
  for (let tag of tags) {
    if (tag.textContent == "") {
      tag.style.display = "none";
    }
  }
}
tagHide();

async function chart(ele) {
  const id = ele.value;
  const breakeven = document
    .getElementById(`${ele.value}Breakeven`)
    .textContent.slice(18);
  const year = new Date().getFullYear();
  const response = await fetch(`/productChart?id=${id}&year=${year}`);
  const responseLast = await fetch(`/productChart?id=${id}&year=${year - 1}`);
  const data = await response.json();
  const dataLast = await responseLast.json();
  const yValuesUnits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const yValuesUnitsLast = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const yValuesPrice = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const yValuesPriceLast = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const yValuesBreakeven = [
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
    breakeven,
  ];
  const xValues = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (element of data) {
    yValuesUnits[element.Monthly - 1] = Number(element.totalSold);
    yValuesPrice[element.Monthly - 1] = Number(element.price);
  }
  for (element of dataLast) {
    yValuesUnitsLast[element.Monthly - 1] = Number(element.totalSold);
    yValuesPriceLast[element.Monthly - 1] = Number(element.price);
  }
  new Chart(`${id}thisYear`, {
    type: "bar",
    data: {
      labels: xValues,
      datasets: [
        {
          type: "line",
          label: "APPU",
          data: yValuesPrice,
          lineTension: 0,
          borderColor: "#2564cf",
          borderWidth: 2,
          fill: false,
          yAxisID: "y1",
        },
        {
          data: yValuesUnits,
          label: "Units",
          type: "bar",
          backgroundColor: "#b23850",
          yAxisID: "y2",
        },
        {
          data: yValuesBreakeven,
          label: `Breakeven`,
          borderWidth: 1,
          type: "line",
          borderColor: "black",
          fill: false,
          pointRadius: 0,
        },
        {
          type: "line",
          label: "APPU Last Year",
          data: yValuesPriceLast,
          lineTension: 0,
          borderColor: "#BBBBBB",
          borderWidth: 2,
          fill: false,
          yAxisID: "y1",
        },
        {
          data: yValuesUnitsLast,
          label: "Units Last Year",
          type: "bar",
          backgroundColor: "#BBBBBB",
          yAxisID: "y2",
        },
      ],
    },
    options: {
      legend: {
        display: true,
        position: "bottom",
      },
      title: {
        display: true,
        text: `Sales Performance`,
      },
      labels: {
        position: "bottom",
      },
      scales: {
        yAxes: [
          {
            id: "y1",
            position: "left",
            type: "linear",
            ticks: {
              beginAtZero: true,
            },
          },
          {
            id: "y2",
            position: "right",
            type: "linear",
            gridLines: {
              display: false,
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  });
}

async function change(ele) {
  const product = ele.closest("form");
  const data = {
    vendorPrice: `${product.vendorPrice.value}`,
    packageCost: `${product.packageCost.value}`,
    packageNo: `${product.packageNo.value}`,
    product_id: `${ele.value}`,
  };
  await fetch("/modifyProduct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  ele.style = "background-color: #4980DE;";
}

async function edit(ele) {
  const table = document.getElementById(`update${ele.value}`);
  table.style.display = "block";
  var span = document.getElementById(`close2${ele.value}`);
  span.onclick = function () {
    table.style.display = "none";
  };
}

async function mark(ele) {
  const product = ele.value;
  const form = ele.closest;
  const msg = ele.closest("form").remark.value;
  if (msg == "") return;
  const data = { id: product, msg: msg };
  const action = await fetch("/remark", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  ele.style = "background-color: #4980DE;";
}

async function show(ele) {
  const table = `myModal${ele.value}`;
  const widget = document.getElementById(table);

  widget.style.display = "block";
  var span = document.getElementById(`close${ele.value}`);
  span.onclick = function () {
    widget.style.display = "none";
  };
}

async function get(ele) {
  const table = `myModal${ele.value}`;
  const widget = document.getElementById(table);
  await getIncoming(ele);
  widget.style.display = "block";
  var span = document.getElementById(`close${ele.value}`);
  span.onclick = function () {
    widget.style.display = "none";
  };
  let btn = document.getElementById(`showBtn${ele.value}`);
  btn.removeAttribute("hidden");
  ele.setAttribute("hidden", "hidden");
}

//get incoming
async function getIncoming(ele) {
  const data = { id: ele.value };
  const result = await fetch("/getIncoming", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const res = await result.json();
  const tableID = `table${ele.value}`;
  const content = document.getElementById(tableID);

  for (let data of res) {
    let row = content.insertRow();
    let po = row.insertCell(0);
    let quantity = row.insertCell(1);
    let ETA = row.insertCell(2);
    po.innerHTML = data.id;
    quantity.innerHTML = data.quantity;
    ETA.innerHTML = data.ETA;
  }
}

//add to cart
async function add(element) {
  const form = element.closest("form");
  const product_id = form.id.value;
  const quantity = form.quantity.value;
  const cart = form.cart.value;
  const data = { product_id: product_id, cart: cart, quantity: quantity };
  if (quantity == "") {
    return;
  }
  const response = await fetch("/addToCart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const cartInfo = await response.json();
  const cartQuantity = cartInfo.quantity;
  const cartID = `${product_id}${cart}`;
  const message = document.getElementById(cartID);
  message.textContent = cartQuantity;
}

const quantity = document.getElementsByClassName("quantity");
Array.from(quantity).forEach((element) => {
  element.addEventListener("input", (e) => {
    element.setAttribute("value", e.target.value);
  });
});

async function setPrice(element) {
  const form = element.closest("form");
  const product_id = form.product_id.value;
  const price = form.sellPrice.value;

  const data2 = { product_id: product_id, sellPrice: price };

  if (price === "") {
    return;
  }
  const response = await fetch("/priceUpdate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data2),
  });
  element.style = "background-color: #4980DE;";
}
