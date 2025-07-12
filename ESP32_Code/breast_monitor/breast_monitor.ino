#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define WIFI_SSID "ACT-ai_101747789504"
#define WIFI_PASSWORD "96729279"

#define API_KEY "AIzaSyDTNBwE2G7ZBgzS9g-lhUr2tZLf6rvP1Ls"
#define DATABASE_URL "https://smartbreastmonitor-default-rtdb.asia-southeast1.firebasedatabase.app"
#define USER_EMAIL "mittaruthika@gmail.com"
#define USER_PASSWORD "6281871403r"

// Firebase setup
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// MLX90614 temperature
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// DS18B20
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Sensor pins
#define GSR_PIN 34
#define FSR_PIN 35
#define PULSE_PIN 32
#define TOUCH_PIN 33

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("Connected!");

  // Firebase
  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Sensor init
  mlx.begin();
  sensors.begin();
  pinMode(TOUCH_PIN, INPUT);
}

void loop() {
  float skinTemp = mlx.readObjectTempC();
  sensors.requestTemperatures();
  float deepTemp = sensors.getTempCByIndex(0);

  int gsrValue = analogRead(GSR_PIN);
  int fsrValue = analogRead(FSR_PIN);
  int touchState = digitalRead(TOUCH_PIN);
  int pulseValue = analogRead(PULSE_PIN);

  Serial.printf("Skin: %.2f°C, Deep: %.2f°C, GSR: %d, FSR: %d, Touch: %d, Pulse: %d\n",
                skinTemp, deepTemp, gsrValue, fsrValue, touchState, pulseValue);

  FirebaseJson json;
  json.set("skin_temp", skinTemp);
  json.set("deep_temp", deepTemp);
  json.set("gsr", gsrValue);
  json.set("fsr", fsrValue);
  json.set("touch", touchState);
  json.set("pulse", pulseValue);
  json.set("timestamp", millis());

  Firebase.RTDB.setJSON(&fbdo, "/breast_monitor/data", &json);

  delay(2000);  // Update every 2 seconds
}
