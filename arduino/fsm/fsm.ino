#include <FiniteStateMachine.h>
#include <Entropy.h>

// How many states are we cycling through?
const byte NUMBER_OF_STATES = 3;

//utility functions
void ledOn() {
  digitalWrite(LED_BUILTIN, HIGH);
}

void ledOff() {
  digitalWrite(LED_BUILTIN, LOW);
}

void ledBlink() {
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(100);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(100);                       // wait for a second
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(100);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(100);                       // wait for a second
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(100);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(100);                       // wait for a second
}
//end utility functions

// Initialize states
State On = State(ledOn);
State Off = State(ledOff);
State Blink = State(ledBlink);

// Initialize state machine, start in state: On
FSM ledStateMachine = FSM(On);

// Counter variable
uint8_t random_byte = 0;
 
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);

  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for Leonardo and Due
  }

  // This routine sets up the watch dog timer with interrupt handler to maintain a
  // pool of real entropy for use in sketches.  This mechanism is relatively slow
  // since it will only produce a little less than two 32-bit random values per 
  // second.
  Entropy.initialize();
}

void loop(){
  // Simulate rolling a six sided die; i.e. produce the numbers 1 through 6
  random_byte = Entropy.random(1,7);

  if(random_byte >= 1 && random_byte <= 2 && !ledStateMachine.isInState(On)) {
    ledStateMachine.transitionTo(On);
    Serial.println("On State");
  } else if(random_byte >= 3 && random_byte <= 4 && !ledStateMachine.isInState(Off)) {
    ledStateMachine.transitionTo(Off);
    Serial.println("Off State");
  } else if(random_byte >= 5 && random_byte <= 6 && !ledStateMachine.isInState(Blink)) {
    ledStateMachine.transitionTo(Blink);
    Serial.println("Blink State");
  }

  ledStateMachine.update();
  delay(1000);
}
