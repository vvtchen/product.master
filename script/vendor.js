async function create(ele) {
  const vendor = document.getElementById("vendor").value;
  const contact = document.getElementById("contact").value;
  const contactEmail = document.getElementById("contactEmail").value;
  const paymentContact = document.getElementById("paymentContact").value;
  const paymentEmail = document.getElementById("paymenyEmail").value;
  const salesContact = document.getElementById("salesContact").value;
  const salesEmail = document.getElementById("salesEmail").value;
  const address = document.getElementById("address").value;
  const payment = document.getElementById("payment").value;
  const data = {
    vendor: vendor,
    contact: contact,
    contactEmail: contactEmail,
    paymentContact: paymentContact,
    paymentEmail: paymentEmail,
    salesContact: salesContact,
    salesEmail: salesEmail,
    address: address,
    payment: payment,
  };
  const response = await fetch("/createVendorInfo", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const vendorInfo = await response.json();
  if (vendorInfo.err) {
    document.getElementById("msg").textContent = "Already Exists";
  } else {
    const table = document.getElementById("table");
    const row = table.insertRow();
    const vendorData = row.insertCell(0);
    vendorData.textContent = vendor;
    const contactData = row.insertCell(1);
    contactData.textContent = contact;
    const contactEmailData = row.insertCell(2);
    contactEmailData.textContent = contactEmail;
    const addressData = row.insertCell(3);
    addressData.textContent = address;
  }
}
