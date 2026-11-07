
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// OLED configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

#define OLED_SDA 11
#define OLED_SCL 10

// Input pins
#define POT_PIN 4
#define CLK_PIN 12
#define DT_PIN 22
#define SW_PIN 0

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

// Oscilloscope settings
#define GRAPH_TOP 18
#define GRAPH_BOTTOM 62
#define GRAPH_HEIGHT 44

int waveform[SCREEN_WIDTH];

int fullScales[] = {500, 1000, 1650, 2500, 3300};
int scaleIndex = 4;

int previousCLK;
int previousSW = HIGH;

int screenMode = 0;

unsigned long lastSampleTime = 0;
unsigned long lastDisplayTime = 0;
unsigned long lastButtonTime = 0;
unsigned long lastEncoderTime = 0;

const unsigned long sampleInterval = 25;

int adcValue = 0;
int voltage = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(OLED_SDA, OLED_SCL);

  if (!display.begin(
    SSD1306_SWITCHCAPVCC,
    0x3C
  )) {
    Serial.println("OLED initialization failed!");
    while (true) {
      delay(1000);
    }
  }

  pinMode(CLK_PIN, INPUT_PULLUP);
  pinMode(DT_PIN, INPUT_PULLUP);
  pinMode(SW_PIN, INPUT_PULLUP);

  analogReadResolution(12);

  previousCLK = digitalRead(CLK_PIN);

  for (int i = 0; i < SCREEN_WIDTH; i++) {
    waveform[i] = GRAPH_BOTTOM / 2;
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(2);
  display.setCursor(12, 20);
  display.println("OSCILLOSCOPE");

  display.setTextSize(1);
  display.setCursor(27, 45);
  display.println("ESP32-H2");

  display.display();

  Serial.println("ESP32-H2 Oscilloscope Started");
  delay(1500);
}

void readPotentiometer() {
  adcValue = analogRead(POT_PIN);
  voltage = analogReadMilliVolts(POT_PIN);

  int maximumVoltage = fullScales[scaleIndex];

  int y = GRAPH_BOTTOM -
          ((long)voltage * GRAPH_HEIGHT /
          maximumVoltage);

  y = constrain(y, GRAPH_TOP, GRAPH_BOTTOM);

  for (int i = 0; i < SCREEN_WIDTH - 1; i++) {
    waveform[i] = waveform[i + 1];
  }

  waveform[SCREEN_WIDTH - 1] = y;
}

void readEncoder() {
  int currentCLK = digitalRead(CLK_PIN);

  if (currentCLK != previousCLK &&
      currentCLK == LOW) {

    if (millis() - lastEncoderTime > 2) {

      if (digitalRead(DT_PIN) != currentCLK) {
        scaleIndex++;
      } else {
        scaleIndex--;
      }

      scaleIndex = constrain(scaleIndex, 0, 4);

      lastEncoderTime = millis();

      Serial.print("Voltage scale: ");
      Serial.print(fullScales[scaleIndex]);
      Serial.println(" mV");
    }
  }

  previousCLK = currentCLK;

  int currentSW = digitalRead(SW_PIN);

  if (currentSW == LOW &&
      previousSW == HIGH &&
      millis() - lastButtonTime > 250) {

    screenMode = !screenMode;

    lastButtonTime = millis();

    Serial.println("Display mode changed");
  }

  previousSW = currentSW;
}

void drawGrid() {
  // Horizontal grid lines
  for (int y = GRAPH_TOP; y <= GRAPH_BOTTOM; y += 11) {
    for (int x = 0; x < SCREEN_WIDTH; x += 4) {
      display.drawPixel(x, y, SSD1306_WHITE);
    }
  }

  // Vertical grid lines
  for (int x = 0; x < SCREEN_WIDTH; x += 16) {
    for (int y = GRAPH_TOP; y <= GRAPH_BOTTOM; y += 3) {
      display.drawPixel(x, y, SSD1306_WHITE);
    }
  }
}

void drawWaveform() {
  display.clearDisplay();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("MINI OSCILLOSCOPE");

  display.setCursor(0, 9);
  display.print("Scale:");

  display.print(fullScales[scaleIndex]);
  display.print("mV");

  drawGrid();

  for (int x = 1; x < SCREEN_WIDTH; x++) {
    display.drawLine(
      x - 1,
      waveform[x - 1],
      x,
      waveform[x],
      SSD1306_WHITE
    );
  }

  display.display();
}

void drawMeter() {
  display.clearDisplay();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("VOLTAGE MONITOR");

  display.setTextSize(2);
  display.setCursor(8, 17);

  display.print(voltage / 1000.0, 2);
  display.println(" V");

  display.setTextSize(1);
  display.setCursor(8, 42);

  display.print("ADC: ");
  display.println(adcValue);

  display.drawRect(5, 54, 118, 8, SSD1306_WHITE);

  int barWidth = constrain(
    (long)voltage * 114 / 3300,
    0,
    114
  );

  display.fillRect(
    7, 56, barWidth, 4,
    SSD1306_WHITE
  );

  display.display();
}

void loop() {
  readEncoder();

  unsigned long currentTime = millis();

  if (currentTime - lastSampleTime >= sampleInterval) {
    lastSampleTime = currentTime;
    readPotentiometer();
  }

  if (currentTime - lastDisplayTime >= 50) {
    lastDisplayTime = currentTime;

    if (screenMode == 0) {
      drawWaveform();
    } else {
      drawMeter();
    }
  }
}
