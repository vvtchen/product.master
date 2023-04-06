const expand = () => {
  const container = document.getElementById("input");
  container.style.display = "inline-block";
  document.getElementById("btn").style.display = "none";
};

const add = async () => {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const data = {
    name: name,
    email: email,
    password: password,
  };
  const response = await fetch("/registerUser", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });

  const result = await response.json();
  if (result.err) {
    document.getElementById("msg").innerHTML = result.err;
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  } else {
    const table = document.getElementById("table");
    const row = table.insertRow();
    const user = row.insertCell(0);
    user.textContent = result.user;
    const Email = row.insertCell(1);
    Email.textContent = result.email;
    document.getElementById("msg").style.display = "none";
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("btn").style.display = "inline-block";
    document.getElementById("input").style.display = "none";
  }
};
