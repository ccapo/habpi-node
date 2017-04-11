import smbus as smbus
import time

i2c_addr = 0x4
i2c = smbus.SMBus(1)

def i2cwrite(str):
    i2c.write_byte(i2c_addr, 0x02)
    for i in map(ord, list(str)):
        i2c.write_byte(i2c_addr, i)
    i2c.write_byte(i2c_addr, 0x03)

def i2cread():
    return i2c.read_byte(i2c_addr)

while True:
    str = raw_input("Enter Message: ")
    if not str:
        continue

    i2cwrite(str)
    print("RPI: Hi Arduino, I sent you: {}".format(str))
    # sleep one second
    time.sleep(1)

    response = i2cread()
    print("Arduino: Hey RPI, I received the message: {}".format(response))
    print("")
