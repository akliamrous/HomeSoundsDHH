import pyaudio
import numpy as np
import sys

RATE = 44100
CHUNK = int(RATE/4) 	# 4 update per second

p=pyaudio.PyAudio()
stream=p.open(format=pyaudio.paInt16,channels=1,rate=RATE,input=True,
              frames_per_buffer=CHUNK)
i=0
#for i in range(int(10*44100/1024)):
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
