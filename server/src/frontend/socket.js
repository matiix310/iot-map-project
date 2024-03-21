const host = "ws://" + window.location.host.split(":")[0] + ":4000";
const socket = io(host);
