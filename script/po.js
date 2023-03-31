const alert = () => {
  const eta = document.getElementsByClassName("eta");
  const status = document.getElementsByClassName("status");
  const today = new Date();
  for (let i = 0; i < eta.length; i++) {
    const time = new Date(eta[i].textContent);
    if (time < today && status[i].textContent !== "received") {
      eta[i].closest("tr").style.color = "red";
    }
  }
};
alert();

const filter = (ele) => {
  const eta = document.getElementsByClassName("eta");
  const status = document.getElementsByClassName("status");
  const today = new Date();
  if (ele.id === "hide") {
    for (let i = 0; i < eta.length; i++) {
      const time = new Date(eta[i].textContent);
      const s = status[i].textContent;
      if (time >= today && s === "not recieve") {
        eta[i].closest("tr").style.display = "none";
      }
    }
    ele.id = "show";
    ele.textContent = "Show All";
  } else {
    for (let i = 0; i < eta.length; i++) {
      const time = new Date(eta[i].textContent);
      const s = status[i].textContent;
      if (time >= today && s === "not recieve") {
        eta[i].closest("tr").style.display = "table-row";
      }
    }
    ele.id = "hide";
    ele.textContent = "Only Show Delay Order";
  }
};
