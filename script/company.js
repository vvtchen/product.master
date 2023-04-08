const expand = () => {
  const container = document.getElementById("input");
  container.style.display = "inline-block";
  document.getElementById("btn").style.display = "none";
};

const add = async () => {
  const email = document.getElementById("email").value;
  const data = {
    email: email,
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
  }

  document.getElementById(
    "msg"
  ).innerHTML = `Invitation has been sent to ${email}`;
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
};

const user = () => {
  const user = document.getElementById("user").textContent;
  const permission = document.getElementById("permission");
  console.log(user);
};

user();
