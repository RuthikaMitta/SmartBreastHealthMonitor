const firebaseConfig = {
  apiKey: "AIzaSyDTNBwE2G7ZBgzS9g-lhUr2tZLf6rvP1Ls",
  authDomain: "smartbreasthealthsystem.firebaseapp.com",
  databaseURL: " https://smartbreasthealthsystem-default-rtdb.firebaseio.com",
  projectId: "smartbreasthealthsystem",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

const ctx = document.getElementById("liveChart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Pulse Rate",
      data: [],
      borderColor: "#007bff",
      fill: false,
    }]
  }
});

function handleLogin() {
  const email = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(userCred => {
      loadPatient(userCred.user.uid);
      showDeviceScreen();
    })
    .catch(() => {
      auth.createUserWithEmailAndPassword(email, pass)
        .then(userCred => {
          storePatientProfile(userCred.user.uid, email);
          showDeviceScreen();
        });
    });
}

function storePatientProfile(uid, email) {
  const name = document.getElementById("username").value;
  const age = prompt("Enter your age:");
  const gender = prompt("Enter your gender (Male/Female):");

  const patientData = {
    name: name,
    email: email,
    age: parseInt(age),
    gender: gender,
    device_id: "",
    created_at: Date.now()
  };

  db.ref("patients/" + uid).set(patientData);
}

function loadPatient(uid) {
  db.ref("patients/" + uid).once("value").then(snapshot => {
    const data = snapshot.val();
    document.getElementById("p_name").textContent = data.name;
    document.getElementById("p_email").textContent = data.email;
    document.getElementById("p_gender").textContent = data.gender;
  });
}

function showDeviceScreen() {
  document.getElementById("loginScreen").classList.add("d-none");
  document.getElementById("deviceScreen").classList.remove("d-none");
}

function connectDevice() {
  const deviceID = document.getElementById("deviceID").value;
  const user = auth.currentUser;

  if (user) {
    db.ref("patients/" + user.uid + "/device_id").set(deviceID);
  }

  document.getElementById("deviceScreen").classList.add("d-none");
  document.getElementById("dashboardScreen").classList.remove("d-none");
  startListening();
}

function startListening() {
  db.ref("/breast_monitor/data").on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;

    document.getElementById("skin_temp").textContent = data.skin_temp;
    document.getElementById("deep_temp").textContent = data.deep_temp;
    document.getElementById("gsr").textContent = data.gsr;
    document.getElementById("fsr").textContent = data.fsr;
    document.getElementById("touch").textContent = data.touch ? "Yes" : "No";
    document.getElementById("pulse").textContent = data.pulse;

    updateChart(data.pulse);
    updateDiagnosis(data);
  });
}

function updateChart(pulse) {
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(pulse);
  if (chart.data.labels.length > 10) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

function updateDiagnosis(data) {
  let diagnosis = "Condition appears normal.";
  if (data.skin_temp > 38 || data.fsr > 800 || data.gsr > 600 || data.pulse > 100) {
    diagnosis = "⚠️ Signs of inflammation or stress. Please consult a doctor.";
  }
  document.getElementById("diagnosis_text").textContent = diagnosis;
}

function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML += `<div><strong>You:</strong> ${msg}</div>`;

  let reply = "I'm not sure, please consult your doctor.";
  if (msg.toLowerCase().includes("pulse")) reply = "Normal pulse is between 60–100 bpm.";
  if (msg.toLowerCase().includes("temp")) reply = "Skin temperature over 38°C may suggest inflammation.";

  chatBody.innerHTML += `<div><strong>AI:</strong> ${reply}</div>`;
  input.value = "";
  chatBody.scrollTop = chatBody.scrollHeight;
}
