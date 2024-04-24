const channelName = "IoT";
const liveTitle = "Hello IoT 👋 Bip Bip | !badapple, !status";
const channelImage = "assets/zerator.png";
const channelColor = "red";
const liveGame = "Rocket League";
const tags = ["Fun", "MQTT", "Lego", "IoT", "Tobias Mühlbauer"];
const dev = false;

var clientName = "matiix310";
var clientColor = "red";

const fillChannels = () => {
  const followedChannelsDiv = document.getElementById("followedChannels");
  fillWithChannels(followedChannelsDiv, followedChannels);
  const recommendedChannelsDiv = document.getElementById("recommendedChannels");
  fillWithChannels(recommendedChannelsDiv, recommendedChannels);
  const alsoWatchChannelsDiv = document.getElementById("alsoWatchChannels");
  fillWithChannels(alsoWatchChannelsDiv, alsoWatchChannels);
};

const fillWithChannels = (container, channels) => {
  for (let channel of channels) {
    const channelBlueprint = `
    <channels class="live-channel">
        <img src="${channel.logo}" />
        <div class="live-channel-meta">
          <h1>${channel.name}</h1>
          <h1>${channel.game}</h1>
        </div>
        <div class="live-channel-viewers">
          <span></span>
          <h1>${channel.viewerCount}</h1>
        </div>
      </div>`;
    container.insertAdjacentHTML("beforeend", channelBlueprint);
  }
};

const hydrateChannelMeta = () => {
  document.getElementById("alsoWatch").innerHTML =
    channelName.toUpperCase() + " VIEWERS ALSO WATCH";

  document.getElementById("liveTitle").innerHTML = liveTitle;
  document.getElementById("channelName").innerHTML = channelName;
  document.getElementById("channelImage").src = channelImage;
  document.getElementById("channelRing").style.borderColor = channelColor;
  document.getElementById("liveGame").innerHTML = liveGame;

  for (let tag of tags) {
    document
      .getElementById("tagsContainer")
      .insertAdjacentHTML("beforeend", `<h1 class="meta-tag">${tag}</h1>`);
  }
};

const displayMessage = (author, message, color = "red") => {
  const chatBox = document.getElementById("chatBox");

  const messageBlueprint = `
  <div class="chat-message">
    <span style="color: ${color}" class="chat-pseudo">${author}</span>
    <span class="chat-content"
      >: ${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
    </span>
  </div>`;

  chatBox.insertAdjacentHTML("afterbegin", messageBlueprint);
};

function pad(d) {
  return d < 10 ? "0" + d.toString() : d.toString();
}

fillChannels();
hydrateChannelMeta();

const timeElement = document.getElementById("timeContainer");
const start = Date.now();

setInterval(() => {
  const elapsed = Math.floor((Date.now() - start) / 1000);

  const seconds = elapsed % 60;
  const minutes = Math.floor((elapsed / 60) % 60);
  const hours = Math.floor(elapsed / 3600);

  timeElement.innerHTML = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}, 1000);

if (!dev) {
  document.getElementById("sendMessageForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = e.target[0].value.trim();
    e.target[0].value = "";

    if (text == "") return;

    if (socket) socket.emit("chatmessage", clientName, clientColor, text);
  });
}

const popup = document.getElementById("popup");
const loginForm = document.getElementById("loginForm");
const colorContainer = document.getElementById("colorContainer");

colorContainer.addEventListener("click", (e) => {
  if (e.target.tagName != "SPAN") return;

  for (let i = 0; i < colorContainer.childElementCount; i++)
    colorContainer.children.item(i).classList.remove("selected");

  e.target.classList.add("selected");
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = e.target[0].value;

  if (username.length == 0 || username.length > 20) return;

  let color = "white";

  for (let i = 0; i < colorContainer.childElementCount; i++) {
    const colorSpan = colorContainer.children.item(i);
    if (colorSpan.classList.contains("selected"))
      color = colorSpan.style["background-color"];
  }

  clientName = username;
  clientColor = color;
  popup.classList.remove("active");
  connectSocket();
});

const loginButton = document.getElementById("loginButton");
const usernameInput = document.getElementById("usernameInput");

usernameInput.addEventListener("input", (e) => {
  if (e.data == null) loginButton.classList.remove("active");
  else if (!loginButton.classList.contains("active")) loginButton.classList.add("active");
});

usernameInput.focus();
