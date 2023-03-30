async function getVendor() {
  const res = await fetch("/vendor");
  const datas = await res.json();
  const vendor = document.getElementById("vendor");
  for (let data of datas) {
    let opt = document.createElement("option");
    opt.value = data.vendorName;
    opt.textContent = data.vendorName;
    vendor.append(opt);
  }
}

getVendor();
