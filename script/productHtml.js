async function getTag() {
  const response = await fetch("/taglist");
  const options = document.getElementById("tag");
  const lists = await response.json();

  for (let tag of lists) {
    const option = document.createElement("option");
    option.textContent = tag.tagName;
    options.append(option);
  }
}
getTag();
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
