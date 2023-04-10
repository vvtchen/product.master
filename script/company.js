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
    document.getElementById("email").value = "";
  } else {
    document.getElementById(
      "msg"
    ).innerHTML = `Invitation has been sent to ${email}`;
    document.getElementById("email").value = "";
  }
};

const user = () => {
  const user = document.getElementById("user").textContent;
  const permission = document.getElementById("permission");
  console.log(user);
};

user();
