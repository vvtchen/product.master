const count = () => {
  const quantity = document.getElementsByClassName("q");
  const total = document.getElementsByClassName("t");
  const msgQ = document.getElementById("msgQ");
  const msgT = document.getElementById("msgT");
  const msgP = document.getElementById("msgP");
  document.getElementById;
  let q = 0;
  let p = 0;
  let t = 0;
  for (let i = 0; i < quantity.length; i++) {
    q += Number(quantity[i].textContent);
    t += Number(total[i].textContent);
    p++;
  }
  msgP.textContent = `Totol SKUs: ${p}`;
  msgQ.textContent = `Totol Quantity: ${q}`;
  msgT.textContent = `Totol Amount ${t}`;
};
count();
