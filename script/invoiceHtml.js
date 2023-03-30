//seach input even lisener
async function valid() {
  let event = document.getElementById("invoiceID");
  event.addEventListener("input", async () => {
    event.value = event.value.replace(/[^a-zA-Z0-9 ]/g, "");
    const response = await fetch(`/invoiceID?id=${event.value}`);
    const data = await response.json();
    if (data.length == 0) {
      document.getElementById("msg").style.display = "inline";
    } else {
      document.getElementById("msg").style.display = "none";
      document.getElementById("form").setAttribute("action", "/invoiceDetail");
    }
  });
}
valid();

// get all vendor name
async function getVendor() {
  const res = await fetch("/vendor");
  const datas = await res.json();
  const vendor = document.getElementById("Vendor");
  for (let data of datas) {
    let opt = document.createElement("option");
    opt.value = data.vendorName;
    opt.textContent = data.vendorName;
    vendor.append(opt);
  }
}

getVendor();
