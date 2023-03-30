const hide = () => {
  const datas = document.getElementsByClassName("rowData");
  for (let data of datas) {
    const value = Number(data.innerHTML.slice(1, 2));
    if (!value) {
      data.removeAttribute("href");
    }
  }
};
hide();
