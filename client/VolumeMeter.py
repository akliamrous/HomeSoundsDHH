import pyaudio
import numpy as np
import sys

RATE = 44100
CHUNK = int(RATE/20) 	# 20 update per second (100ms per update)

p=pyaudio.PyAudio()
stream=p.open(format=pyaudio.paInt16,channels=1,rate=RATE,input=True,
              frames_per_buffer=CHUNK)

while True:
    data = np.fromstring(stream.read(CHUNK),dtype=np.int16)
    peak=np.average(np.abs(data))*2
    bars=50*peak/2**16
    print("%s"%(bars))
    #bars="#"*int(50*peak/2**16)
    #print("%04d %05d %s"%(i,peak,bars))
    #i+=1
    sys.stdout.flush()

stream.stop_stream()
stream.close()
p.terminate()