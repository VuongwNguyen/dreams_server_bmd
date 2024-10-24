let token = null;
let socket = null;
let headersOption = {
  authorization: "",
  "Content-type": "application/json",
};

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("http://localhost:8012/api/account/login", {
    body: JSON.stringify({
      UserIF: e.target[0].value,
      password: e.target[1].value,
    }),
    headers: {
      ...headersOption,
    },
    method: "POST",
  });

  if (!res.ok) {
    document.getElementById("login-status").innerText = "Login failure";
  }

  const data = await res.json();
  token = data.data.accessToken;
  headersOption = {
    ...headersOption,
    authorization: `Bearer ${token}`,
  };

  document.getElementById("login-status").innerText = data.message;
});

document.getElementById("fetch-btn").addEventListener("click", async () => {
  let response = await fetch(
    "http://localhost:8012/api/follow/get-followings?_page=1&_limit=20",
    {
      method: "GET",
      headers: headersOption,
    }
  );

  let data = await response.json();

  let list = data.data.list;

  const selection = document.getElementById("list-users");
  selection.innerHTML = "";
  const option = document.createElement("option");
  option.innerText = "list of following user";

  selection.appendChild(option);

  list.forEach((element) => {
    const option = document.createElement("option");
    option.value = element.following._id;
    option.innerText =
      element.following.first_name + " " + element.following.last_name;

    selection.appendChild(option);
  });
});

document.getElementById("test-btn").addEventListener("click", () => {
  socket?.emit("mock");
});

document.getElementById("clear-btn").addEventListener("click", () => {});

document
  .getElementById("fetch-room-btn")
  .addEventListener("click", async () => {});

document.getElementById("connect-socket").addEventListener("click", () => {
  socket = io({
    auth: {
      token: token,
    },
  });

  document.getElementById("socket-status").innerHTML =
    "Connect socket success!!!";

  socket.on("hello", () => console.log("Receive event hello"));
});
