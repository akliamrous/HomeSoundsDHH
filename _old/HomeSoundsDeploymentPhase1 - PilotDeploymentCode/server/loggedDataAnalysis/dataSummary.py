import json
import pprint

data = []
with open('homesounds-server.log') as f:
    for line in f:
         data.append(json.loads(line))

#print (data[0]['Location'][0])
eventDict = {}
for line in data:
    if line['message'] == "sound event":
        if  (line['Time']).split(" ")[0] not in eventDict:
            eventDict[(line['Time']).split(" ")[0]] = {"dj-home"   : {"Low": 0, "Med": 0, "Loud": 0}, 
                                                       "dj-office" : {"Low": 0, "Med": 0, "Loud": 0},
                                                       "jon-office": {"Low": 0, "Med": 0, "Loud": 0}}
        eventDict[(line['Time']).split(" ")[0]][line['Location'][0]][line['Event']] +=1

pprint.pprint(eventDict)