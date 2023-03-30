chart();
async function chart() {
  const vendor = document.getElementById("vendor").textContent;
  const year = new Date().getFullYear();
  const sales = await fetch(
    `/dbChartSalesVendor?year=${year}&vendor=${vendor}`
  );
  const salesData = await sales.json();
  const lastSales = await fetch(
    `/dbChartSalesVendor?year=${year - 1}&vendor=${vendor}`
  );
  const lastSalesData = await lastSales.json();
  console.log(salesData);
  console.log(lastSalesData);
  const invoice = await fetch(
    `/dbChartInvoiceVendor?year=${year}&vendor=${vendor}`
  );
  const invoiceData = await invoice.json();
  const lastInvoice = await fetch(
    `/dbChartInvoiceVendor?year=${year - 1}&vendor=${vendor}`
  );
  const lastInvoiceData = await lastInvoice.json();
  console.log(invoiceData);
  console.log(lastInvoiceData);
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
  let gms = Array(12).fill(0);
  let gmsLast = Array(12).fill(0);
  let margin = Array(12).fill(0);
  let marginLast = Array(12).fill(0);
  for (let ele of salesData) {
    gms[ele.month - 1] = ele.GMS;
    margin[ele.month - 1] = Math.round(
      (Number(ele.profit) / Number(ele.GMS)) * 100
    );
    document.getElementById(`sku${ele.month}`).textContent = ele.skuSold;
    document.getElementById(`units${ele.month}`).textContent = ele.totalUnits;
    document.getElementById(`gms${ele.month}`).textContent = `$${ele.GMS}`;
    document.getElementById(`margin${ele.month}`).textContent = `${Math.round(
      (Number(ele.profit) / Number(ele.GMS)) * 100
    )}%`;
    document.getElementById(
      `profit${ele.month}`
    ).textContent = `$${ele.profit}`;
  }
  for (let ele of lastSalesData) {
    gmsLast[ele.month - 1] = ele.GMS;
    marginLast[ele.month - 1] = Math.round(
      (Number(ele.profit) / Number(ele.GMS)) * 100
    );
    document.getElementById(`lsku${ele.month}`).textContent = ele.skuSold;
    document.getElementById(`lunits${ele.month}`).textContent = ele.totalUnits;
    document.getElementById(`lgms${ele.month}`).textContent = `$${ele.GMS}`;
    document.getElementById(`lmargin${ele.month}`).textContent = `${Math.round(
      (Number(ele.profit) / Number(ele.GMS)) * 100
    )}%`;
    document.getElementById(
      `lprofit${ele.month}`
    ).textContent = `$${ele.profit}`;
  }

  for (let ele of invoiceData) {
    document.getElementById(`psku${ele.month}`).textContent = ele.sku;
    document.getElementById(`punits${ele.month}`).textContent =
      ele.totalPurchaseQuantity;
    document.getElementById(
      `pamount${ele.month}`
    ).textContent = `$${ele.totalPurchase}`;
  }

  for (let ele of lastInvoiceData) {
    document.getElementById(`lpsku${ele.month}`).textContent = ele.sku;
    document.getElementById(`lpunits${ele.month}`).textContent =
      ele.totalPurchaseQuantity;
    document.getElementById(
      `lpamount${ele.month}`
    ).textContent = `$${ele.totalPurchase}`;
  }

  new Chart(`this`, {
    type: "bar",
    data: {
      labels: xValues,
      datasets: [
        {
          type: "line",
          yAxisID: "y",
          label: year,
          data: gms,
          lineTension: 0,
          borderColor: "#2564cf",
          borderWidth: 3,
          fill: false,
          order: 1,
        },
        {
          data: margin,
          yAxisID: "y1",
          type: "bar",
          label: `${year} Margin`,
          backgroundColor: "#b23850",
          order: 1,
        },
        {
          data: gmsLast,
          yAxisID: "y",
          label: year - 1,
          lineTension: 0,
          type: "line",
          fill: false,
          borderColor: "#BBBBBB",
          order: 2,
        },
        {
          data: marginLast,
          type: "bar",
          label: `${year - 1} Margin`,
          backgroundColor: "#BBBBBB",
          yAxisID: "y1",
          order: 2,
        },
      ],
    },
    options: {
      scales: {
        yAxes: [
          {
            id: "y",
            position: "left",
            type: "linear",
            gridLines: {
              display: false,
            },
            ticks: {
              beginAtZero: true,
            },
          },
          {
            id: "y1",
            position: "right",
            type: "linear",
            beginAtZero: true,
            ticks: {
              max: 100,
              beginAtZero: true,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
}

inventory();

async function inventory() {
  const vendor = document.getElementById("vendor").textContent;
  const response = await fetch(`/inventoryVendor?vendor=${vendor}`);
  const data = await response.json();
  document.getElementById("sku").textContent = Number(data[0].SKU);
  document.getElementById("inventory").textContent = `${Number(
    data[0].inventory
  )}  ($${data[0].inventoryAmount})`;
}
getThisYear();

async function getThisYear() {
  const vendor = document.getElementById("vendor").textContent;
  const year = new Date().getFullYear();
  document.getElementById("last").textContent = `${year - 1}`;
  document.getElementById("current").textContent = `${year}`;

  const sales = await fetch(`/salesDataVendor?year=${year}&vendor=${vendor}`);
  const invoice = await fetch(
    `/invoiceDataVendor?year=${year}&vendor=${vendor}`
  );
  const salesData = await sales.json();
  const invoiceData = await invoice.json();
  document.getElementById("purchaseUnits").textContent =
    invoiceData[0].totalPurchaseUnits;
  document.getElementById(
    "purchaseAmount"
  ).textContent = `$${invoiceData[0].totalPurchase}`;
  document.getElementById("soldUnits").textContent =
    salesData[0].totalSoldUnits;
  document.getElementById("gms").textContent = `$${salesData[0].GMS}`;
  document.getElementById("profit").textContent = `$${
    salesData[0].GMS - invoiceData[0].totalPurchase
  }`;
  document.getElementById("margin").textContent = `${Math.round(
    ((salesData[0].GMS - invoiceData[0].totalPurchase) / salesData[0].GMS) * 100
  )}%`;
  document.getElementById("purchaseCount").textContent =
    invoiceData[0].SKUCount;
  document.getElementById("soldUnitsCount").textContent = salesData[0].SKUCount;

  const salesLast = await fetch(
    `/salesDataVendor?year=${year - 1}&vendor=${vendor}`
  );
  const invoiceLast = await fetch(
    `/invoiceDataVendor?year=${year - 1}&vendor=${vendor}`
  );
  const salesDataLast = await salesLast.json();
  const invoiceDataLast = await invoiceLast.json();
  if (salesDataLast[0].SKUCount !== 0 && invoiceDataLast[0].SKUCount !== 0) {
    document.getElementById("purchaseUnitsLast").textContent =
      invoiceDataLast[0].totalPurchaseUnits;
    document.getElementById(
      "purchaseAmountLast"
    ).textContent = `$${invoiceDataLast[0].totalPurchase}`;
    document.getElementById("soldUnitsLast").textContent =
      salesDataLast[0].totalSoldUnits;
    document.getElementById("gmsLast").textContent = `$${salesDataLast[0].GMS}`;
    document.getElementById("profitLast").textContent = `$${
      salesDataLast[0].GMS - invoiceDataLast[0].totalPurchase
    }`;
    document.getElementById("marginLast").textContent = `${Math.round(
      ((salesDataLast[0].GMS - invoiceDataLast[0].totalPurchase) /
        salesDataLast[0].GMS) *
        100
    )}%`;
    document.getElementById("purchaseCountLast").textContent =
      invoiceDataLast[0].SKUCount;
    document.getElementById("soldUnitsCountLast").textContent =
      salesDataLast[0].SKUCount;
  }
}
