var mqtt = require('mqtt');
var timeout = -1, period = 3
var payloadRt = `{"idTrans": 0,"data": {"status": true, "period": ${period},  "timeout": ${timeout}}}`;
// Function to convert units with two decimals
// Used for converting watts to kW, Var to kVar
function convertUnits(unitInitial) {
    var unitChanged = (unitInitial/ 1000).toFixed(2);
    return unitChanged;
}
function updateRtValues(timeoutValue, periodValue){
    timeout = timeoutValue
    period = periodValue
    payloadRt = `{"idTrans": 0,"data": {"status": true, "period": ${period},  "timeout": ${timeout}}}`;
}
function loadRtMeasures(topic, jsonData){
    var msg = {
        topic: topic,
        payload: {
            "evsePower": convertUnits(jsonData.data.evsePower),
            "homePower": convertUnits(jsonData.data.homePower),
            "totalPower": convertUnits(jsonData.data.totalPower),
            "actPwCon1": [
                convertUnits(jsonData.data.elements[0].now.aPow[0]),
                convertUnits(jsonData.data.elements[0].now.aPow[1]),
                convertUnits(jsonData.data.elements[0].now.aPow[2])
            ],
            "actPwCon2": [
                jsonData.data.elements[1] !== undefined ? convertUnits(jsonData.data.elements[1].now.aPow[0]):"none",
                jsonData.data.elements[1] !== undefined ? convertUnits(jsonData.data.elements[1].now.aPow[1]):"none",
                jsonData.data.elements[1] !== undefined ? convertUnits(jsonData.data.elements[1].now.aPow[2]):"none"
            ],
            "reactPwCon1": [
                convertUnits(jsonData.data.elements[0].now.rPow[0]),
                convertUnits(jsonData.data.elements[0].now.rPow[1]),
                convertUnits(jsonData.data.elements[0].now.rPow[2])
            ],
            "reactPwCon2": [
                jsonData.data.elements[1] !== undefined ? convertUnits(jsonData.data.elements[1].now.rPow[0]):"none",
                jsonData.data.elements[1] !== undefined ?convertUnits(jsonData.data.elements[1].now.rPow[1]):"none",
                jsonData.data.elements[1] !== undefined ?convertUnits(jsonData.data.elements[1].now.rPow[2]):"none"
            ],
            "actEnergyCon1": convertUnits(jsonData.data.elements[0].now.active),
            "actEnergyCon2": jsonData.data.elements[1] !== undefined ?convertUnits(jsonData.data.elements[1].now.active): "none",
            "currentAssignCon1": convertUnits(jsonData.data.elements[0].now.assignment),
            "currentAssignCon2": jsonData.data.elements[1] !== undefined ? convertUnits(jsonData.data.elements[1].now.assignment): "none",
            "reactEnergyCon1": convertUnits(jsonData.data.elements[0].now.reactive),
            "reactEnergyCon2": jsonData.data.elements[1] !== undefined ?convertUnits(jsonData.data.elements[1].now.reactive): "none",
            "totalEnergy": convertUnits(jsonData.data.totalEnergy),
            "relOverload": convertUnits(jsonData.data.relOverload),
            "totalCurrent": convertUnits(jsonData.data.totalCurrent[0]),
            "battEnergy" : convertUnits(jsonData.data.battEnergy),
            "fvPower" : jsonData.data.fvPower !== undefined ? convertUnits(jsonData.data.fvPower) : "Only in solar",
            "instPower": jsonData.data.instPower !== undefined ? convertUnits(jsonData.data.instPower): "Only in solar"
        }
    };
    return msg;
}
function loadInfoParam(topic, jsonData){
    var msg = {
        topic: topic,
        payload: {
            "ethernet": jsonData.data.ethernet,
            "ocpp": jsonData.data.ocpp,
            "rfid": jsonData.data.rfid,
            "spl" : jsonData.data.spl,
            "schuko": jsonData.data.schuko,
            "modbus": jsonData.data.modbus,
            "solar": jsonData.data.solar,
            "mac": jsonData.data.mac,
            "fwApp": jsonData.data.fwv,
            "hwver": jsonData.data.hwv,
            "model": jsonData.data.model,
            "serial": jsonData.data.serial,
            "fwCortex":jsonData.data.fwv_cortex,
            "fwPwVers":jsonData.data.fwv_pot,
            "hwPwVersion":jsonData.data.hwv_pot,
            "maxPower":jsonData.data.maxPower,
            "limitPower":jsonData.data.limitPower,
            "selectorPower":jsonData.data.selectorPower,
           
        }
    };
    return msg;
}

function loadMqttParam(topic, jsonData){
    var msg = {
        topic: topic,
        payload: {
            "keepAlive": jsonData.data.cfg.keepAlive,
            "mqttUrl": jsonData.data.cfg.mqttUrl,
            "mqttPort": jsonData.data.cfg.mqttPort,
            "mqttUser" : jsonData.data.cfg.mqttUser,
            "mqttClientId": jsonData.data.cfg.mqttClientId,
            "qos": jsonData.data.cfg.qos,
            "pingInterval": jsonData.data.cfg.pingInterval,
           
        }
    };
    return msg;
}
function stateMennekes(stateNumber){
    switch (stateNumber) {
        case 0:
            state="Standby";
            break;
        case 1:
            state="Disconnected";
            break;
        case 2:
            state="Disconnected with permission";
            break;
        case 3:
            state="Connected";
            break;
        case 4:
            state="Connected with permission";
            break;
        case 5:
            state="Charging";
            break;
        case 6:
            state="Charging: power limit";
            break;
        case 7:
            state="Paused charging";
            break;
        case 8:
            state="Charging finished";
            break;
        case 9:
            state="Hardware error";
            break;
        case 10:
            state="AC leakage error";
            break;
        case 11:
            state="DC leakage error";
            break;
        case 12:
            state="Diode error";
            break;
        case 13:
            state="PE ground error";
            break;
        case 32:
            state="Inoperative";
            break;
        case 33:
            state="Selected";
            break;
        case 34:
            state="Reserved";
            break;
        case 35:
            state="Motor error";
            break;
    }  
    return state;   

}

function stateSchuko(stateNumber){
    switch (stateNumber) {
        case 0:
            state = "schuko standby";
            break;
        case 14:
            state="schuko ON, load";
            break;
        case 30:
            state="schuko ON, not load";
            break;
        case 31:
            state="schuko OFF";
            break;
    }
    return state;
}

function loadConn1Param(topic, jsonData, model){
    var msg;
    if(model=='UNI'){
        msg = {
            topic: topic,
            payload: {
                "user": jsonData.data.stat.user,
                "state_mennekes": stateMennekes(jsonData.data.stat.state),        
            }
        };
    }
    else{
        msg = {
            topic: topic,
            payload: {
                "user": jsonData.data.stat.user,
                "state_mennekes1": stateMennekes(jsonData.data.stat.state),        
            }
        }; 
    }    
    return msg;
}

function loadConn2Param(topic, jsonData, model){
    var msg;
    if(model=='UNI'){
        msg = {
            topic: topic,
            payload: {
                "user": jsonData.data.stat.user,
                "state_schuko": stateSchuko(jsonData.data.stat.state),        
            }
        };
    }
    else{
        msg = {
            topic: topic,
            payload: {
                "user": jsonData.data.stat.user,
                "state_mennekes2": stateMennekes(jsonData.data.stat.state),        
            }
        };
    }
    return msg;
}

function subscribeTopics(clientMqtt, topic){
    clientMqtt.subscribe(topic, function(err) {
        if (err) {
            console.error('Error subscribing to the topic:', topic);
        } 
    });
}
function publishTopic(clientMqtt, topic, mensaje, qos){
    var publicOptions={
        qos:qos,
    }
    clientMqtt.publish(topic, mensaje, publicOptions, function (err) {
        if (err) {
          console.error('Error publishing the message:', err);
        } 
    });
}
module.exports = function(RED) {
    var registeredSerialNumbers = [];
    var connections = [];
    
    function ViarisNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var serialNumber = config.serialNumber;
        var brokerServer = config.brokerServer;
        var username = config.username;
        var password = config.password;
        var port =parseInt(config.port);
        var qos = parseInt(config.qos);
        var keepalive = parseInt(config.keepalive);
        
        // Check if a connection already exists for this serial number
        // Register the serial number if not already registered

        if (!registeredSerialNumbers.includes(serialNumber)) {
            registeredSerialNumbers.push(serialNumber);
            connections.push(null);  
        }

        // Configure MQTT connection details

        var mqttOptions = {
            clientId: 'ViarisClient_' + serialNumber,  
            username: username,          
            password: password,          
            port: port,
            keepalive: keepalive
        };
        brokerServer = "mqtt://" + brokerServer;

        // Create a new MQTT connection or retrieve the existing one

        if (!connections[registeredSerialNumbers.indexOf(serialNumber)]) {
            connections[registeredSerialNumbers.indexOf(serialNumber)] = mqtt.connect(brokerServer, mqttOptions);
        }
        // Get the MQTT connection for this serial number
        var client = connections[registeredSerialNumbers.indexOf(serialNumber)];
        var topicToSubscribeConn1, topicToSubscribeConn2, topicGetConn1, topicGetConn2, topicStartStopConn1, topicStartStopConn2, model;
       // Subscription topics
        var shortSerialNumber = "0" + serialNumber.slice(-5);
        var topicToSubscribe_rt = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/streamrt/modulator';
        var topicToSubscribe_boot_sys = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/boot/sys';
        var topicToSubscribe_mqtt = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/cfg/mqtt_user';
        var topicToSubscribe_init_boot_sys = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/init_boot/sys';
        // Publish topics
        var topicSetRt = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/rt/modulator';
        //var payloadRt = `{"idTrans": 0,"data": {"status": true, "period": ${period},  "timeout": ${timeout}}}`;
        var topicGetMqtt = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/cfg/mqtt_user';
        var topicGetSysBoot = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/boot/sys';
        var payloadGet = '{"idTrans": 0}'
        var payloadStart = '{"idTrans":49685,"header":{"timestamp":1665381726837, "heapFree":0}, "data":{"uid":1, "source":"app", "priority":0,"action":1,"user":"","group":0}}';
        var payloadStop = '{"idTrans":49685,"header":{"timestamp":1665381726837, "heapFree":0}, "data":{"uid":1, "source":"app", "priority":0,"action":0,"user":"","group":0}}';
        if (serialNumber[4]=='3'){
            
            topicToSubscribeConn1 = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/mennekes';
            topicToSubscribeConn2 = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/schuko';
            topicGetConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/mennekes';
            topicGetConn2 = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/schuko';
            topicStartStopConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/request/reqman/mennekes';
            topicStartStopConn2 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/request/reqman/schuko';
            topicSetCurrentConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/value/mennekes';
            model='UNI';

        }else{
            topicToSubscribeConn1 = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/mennekes1';
            topicToSubscribeConn2 = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/mennekes2';
            topicGetConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/mennekes1';
            topicGetConn2 = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/mennekes2';
            topicStartStopConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/request/reqman/mennekes1';
            topicStartStopConn2 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/request/reqman/mennekes2';
            topicSetCurrentConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/value/mennekes1';
            topicSetCurrentConn2 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/value/mennekes2';
            model='COMBIPLUS'
        }
        node.on('input', function(msg) {
            var payloadCurrentConn;
            if(msg.payload==="StartConn1"){
                publishTopic(client, topicStartStopConn1, payloadStart, qos);
            }else if(msg.payload==="StopConn1"){
                publishTopic(client, topicStartStopConn1, payloadStop, qos);
            }else if(msg.payload==="StartConn2"){
                publishTopic(client, topicStartStopConn2, payloadStart, qos);
            }else if(msg.payload==="StopConn2"){
                publishTopic(client, topicStartStopConn2, payloadStop,qos);
            }else if(msg.payload==="SetCurrentConn1"){ 
                let value = Number(msg.topic)
                if ((value <0 || value>32) || isNaN(value)){
                   node.error("The value of msg.topic must be between 0 and 32.");
                   return
                }
                value *= 1000
                msg.topic = value.toString()
                payloadCurrentConn = `{"idTrans":1, "data":{"stat":{"ampacitySmCh": ${msg.topic}}}}`;
                publishTopic(client, topicSetCurrentConn1, payloadCurrentConn,qos);
               
                
            }else if(msg.payload==="SetCurrentConn2"){ 
                let value = Number(msg.topic)
                if ((value <0 || value>32) || isNaN(value)){
                    node.error("The value of msg.topic must be between 0 and 32.");
                    return
                }
                value *= 1000
                msg.topic = value.toString()
                payloadCurrentConn = `{"idTrans":1, "data":{"stat":{"ampacitySmCh": ${msg.topic}}}}`;
                publishTopic(client, topicSetCurrentConn2, payloadCurrentConn,qos); 
              
                
            }else if(msg.payload==="SetRtFrame"){
                let topicString = JSON.stringify(msg.topic)
                let valuesRt = JSON.parse(topicString);
                if (valuesRt.period <= 0 || valuesRt.period > 1000 || isNaN(valuesRt.period) ){
                    node.error("Period value must be > 0 and <= 1000");
                    return
                }
                if (valuesRt.timeout < -1 || valuesRt.tiemout > 1000 || isNaN(valuesRt.timeout) ){
                    node.error("Period value must be >= -1 and <= 1000");
                    return
                }
                updateRtValues(valuesRt.timeout, valuesRt.period)
                publishTopic(client, topicSetRt, payloadRt,qos); 

            }   
           
        });
        // "Connect" event handler
        client.on('connect', function() {
            // Executed when the connection with the broker is established
            console.log('Connected Viaris to the MQTT broker.');
            node.status({ fill: "green", shape: "dot", text: "MQTT connected"});
            // Topic subscription
            subscribeTopics(client, topicToSubscribe_rt); 
            subscribeTopics(client, topicToSubscribe_boot_sys);     
            subscribeTopics(client, topicToSubscribe_mqtt);    
            subscribeTopics(client, topicToSubscribeConn1);   
            subscribeTopics(client, topicToSubscribeConn2);  
            // Topic publishing
            publishTopic(client, topicGetMqtt, payloadGet, qos); 
            publishTopic(client, topicGetConn1, payloadGet, qos);
            publishTopic(client, topicGetSysBoot, payloadGet, qos);
            publishTopic(client, topicGetConn2, payloadGet, qos);
            publishTopic(client, topicSetRt, payloadRt, qos);
            // Synchronous publishing of 'get' type topics
            setInterval(function() {publishTopic(client, topicGetMqtt, payloadGet, qos);}, 15000);        // 15000 ms  
            setInterval(function() {publishTopic(client, topicGetConn1, payloadGet, qos);}, 4000);       // 4000 ms 
            setInterval(function() {publishTopic(client, topicGetSysBoot, payloadGet, qos);}, 7000);     // 7000 ms
            setInterval(function() {publishTopic(client, topicGetConn2, payloadGet, qos);}, 5000);       // 5000 ms
           // Synchronous publishing of 'set' type topics
            setInterval(function() {publishTopic(client, topicSetRt, payloadRt, qos);}, 60000);          // 60s
        });
        client.on('close', function() {
            node.status({ fill: "red", shape: "dot", text: "MQTT disconnected" });
        });
        client.on('offline', function() {
            node.status({ fill: "red", shape: "dot", text: "Client disconnected" });
        });
        client.on('error', function() {
            node.status({ fill: "red", shape: "dot", text: "Error" });
        });
       // Handler for incoming messages
       client.on('message', function(topic, message) {
            // topic: The topic where the message was received
            // message: The received message (in Buffer format)
            // Perform actions with the received message and the obtained measurements
            var jsonDataConv = JSON.parse(message.toString());
           // Sends the processed message to the corresponding output
            var msgRt=null;
            var msgBootSys=null;
            var msgConn1 = null;
            var msgMqtt = null;
            var msgConn2 = null;
            if(topic!= topicToSubscribe_init_boot_sys){
                switch (topic) {
                    case topicToSubscribe_rt:
                        msgRt=loadRtMeasures(topic, jsonDataConv);
                        break;
                    case topicToSubscribe_boot_sys:
                        msgBootSys=loadInfoParam(topic, jsonDataConv);
                        break;
                    case topicToSubscribe_mqtt:
                        msgMqtt=loadMqttParam(topic, jsonDataConv);
                        break;
                    case topicToSubscribeConn1:
                        msgConn1=loadConn1Param(topic, jsonDataConv, model);
                        break;
                    case topicToSubscribeConn2:
                        msgConn2=loadConn2Param(topic, jsonDataConv, model);
                        break;
                }     
                node.send([msgRt, msgMqtt, msgBootSys, msgConn1, msgConn2]);
            }else{
                publishTopic(topicSetRt, payloadRt,qos)
            }

        });
        // Node close handler
        node.on('close', function(done) {
            // Close the MQTT connection only if this node is the last one using it
            if (client && client.connected) {
                client.end(done);
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType("viaris",ViarisNode);
}
