var mqtt = require('mqtt');
// Función para convertir unidades con dos decimales
// Sirve para watios a kW, Var a kVar
function convertUnits(unitInitial) {
    var unitChanged = (unitInitial/ 1000).toFixed(2);
    return unitChanged;
}
function loadRtMeasures(topic, jsonData){
    var msg = {
        topic: topic,
        payload: {
            "evsePower": convertUnits(jsonData.data.evsePower),
            "homePower": convertUnits(jsonData.data.homePower),
            "totalPower": convertUnits(jsonData.data.totalPower),
            "actPwCon1": convertUnits(jsonData.data.elements[0].now.aPow[0]),
            "actPwCon2": convertUnits(jsonData.data.elements[1].now.aPow[0]),
            "rectPwCon1": convertUnits(jsonData.data.elements[0].now.rPow[0]),
            "rectPwCon2": convertUnits(jsonData.data.elements[1].now.rPow[0]),
            "actEnergyCon1": convertUnits(jsonData.data.elements[0].now.active),
            "actEnergyCon2": convertUnits(jsonData.data.elements[1].now.active),
            "reactEnergyCon1": convertUnits(jsonData.data.elements[0].now.reactive),
            "reactEnergyCon2": convertUnits(jsonData.data.elements[1].now.reactive),
            "totalEnergy": convertUnits(jsonData.data.totalEnergy),
            "relOverload": convertUnits(jsonData.data.relOverload),
            "totalCurrent": convertUnits(jsonData.data.totalCurrent[0]), 
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
            state="Disconnected without permission";
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
            state="error";
            break;
        case 10:
            state="error";
            break;
        case 11:
            state="error";
            break;
        case 12:
            state="error";
            break;
        case 12:
            state="error";
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
            console.error('Error al suscribirse al topic:', topic);
        } else {
            console.log('Suscrito al topic:', topic);
        }
    });
}
function publishTopic(clientMqtt, topic, mensaje, qos){
    var publicOptions={
        qos:qos,
    }
    clientMqtt.publish(topic, mensaje, publicOptions, function (err) {
        if (err) {
          console.error('Error al publicar el mensaje:', err);
        } else {
          console.log('Topic MQTT publicado:', topic);
          console.log('Payload MQTT publicado:', mensaje);
          console.log('Calidad de servicio qos', publicOptions)
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
        console.log("Keepalive", keepalive);
        console.log("qos", qos);
        console.log("port", port);
         // Comprobar si ya existe una conexión para este número de serie
        // Registra el número de serie si aún no está registrado
        if (!registeredSerialNumbers.includes(serialNumber)) {
            registeredSerialNumbers.push(serialNumber);
            connections.push(null); // Agrega una entrada nula al array de conexiones
        }

        // Configura los detalles de conexión MQTT
        var mqttOptions = {
            clientId: 'ViarisClient_' + serialNumber, // Nombre del cliente MQTT con número de serie
            username: username,         // Usuario (si es necesario)
            password: password,         // Contraseña (si es necesario)
            port: port,
            keepalive: keepalive
        };
        brokerServer = "mqtt://" + brokerServer;

        // Crea una nueva conexión MQTT o recupera la existente
        if (!connections[registeredSerialNumbers.indexOf(serialNumber)]) {
            connections[registeredSerialNumbers.indexOf(serialNumber)] = mqtt.connect(brokerServer, mqttOptions);
        }
        // Obtiene la conexión MQTT para este número de serie
        var client = connections[registeredSerialNumbers.indexOf(serialNumber)];
        var topicToSubscribeConn1, topicToSubscribeConn2, topicGetConn1, topicGetConn2, topicStartStopConn1, topicStartStopConn2, model;
        // Suscripción a los topics
        var shortSerialNumber = "0" + serialNumber.slice(-5);
        var topicToSubscribe_rt = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/streamrt/modulator';
        var topicToSubscribe_boot_sys = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/boot/sys';
        var topicToSubscribe_mqtt = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/cfg/mqtt_user';
        var topicToSubscribe_init_boot_sys = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/init_boot/sys';
        // Topics de publicación
        var topicSetRt = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/rt/modulator';
        var payloadRt = '{"idTrans": 0,"data": {"status": true,"period": 5,"timeout": 10000}}';
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
            model='UNI';

        }else{
            topicToSubscribeConn1 = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/mennekes1';
            topicToSubscribeConn2 = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/mennekes2';
            topicGetConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/mennekes1';
            topicGetConn2 = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/mennekes2';
            topicStartStopConn1 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/request/reqman/mennekes1';
            topicStartStopConn2 = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/request/reqman/mennekes2';
            model='COMBIPLUS'
        }
        node.on('input', function(msg) {
            console.log(msg.payload);
            if(msg.payload==="StartConn1"){
                publishTopic(client, topicStartStopConn1, payloadStart, qos);
            }else if(msg.payload==="StopConn1"){
                publishTopic(client, topicStartStopConn1, payloadStop, qos);
            }else if(msg.payload==="StartConn2"){
                publishTopic(client, topicStartStopConn2, payloadStart, qos);
            }else if(msg.payload==="StopConn2"){
                publishTopic(client, topicStartStopConn2, payloadStop,qos);
            }     
        });
        // Manejador del evento "connect"
        client.on('connect', function() {
            // Se ejecuta cuando la conexión con el broker es establecida
            console.log('Conectado viaris al broker MQTT');
            node.status({ fill: "green", shape: "dot", text: "MQTT connected"});
            // Subscripción de topics
            subscribeTopics(client, topicToSubscribe_rt); 
            subscribeTopics(client, topicToSubscribe_boot_sys);     
            subscribeTopics(client, topicToSubscribe_mqtt);    
            subscribeTopics(client, topicToSubscribeConn1);   
            subscribeTopics(client, topicToSubscribeConn2);  
            // Publicación de topics
            publishTopic(client, topicGetMqtt, payloadGet, qos); 
            publishTopic(client, topicGetConn1, payloadGet, qos);
            publishTopic(client, topicGetSysBoot, payloadGet, qos);
            publishTopic(client, topicGetConn2, payloadGet, qos);
            publishTopic(client, topicSetRt, payloadRt, qos);
            // Publicación síncrona de topics tipo get
            setInterval(function() {publishTopic(client, topicGetMqtt, payloadGet, qos);}, 6000);        // 6000 milisegundos  
            setInterval(function() {publishTopic(client, topicGetConn1, payloadGet, qos);}, 4000);       // 4000 milisegundos  
            setInterval(function() {publishTopic(client, topicGetSysBoot, payloadGet, qos);}, 7000);     // 7000 milisegundos  
            setInterval(function() {publishTopic(client, topicGetConn2, payloadGet, qos);}, 5000);       // 5000 milisegundos
            // Publicación síncrona de topics tipo set
            setInterval(function() {publishTopic(client, topicSetRt, payloadRt, qos);}, 10000);          // 10000 milisegundos
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
       // Manejador de mensajes entrantes
       client.on('message', function(topic, message) {
            // topic: El topic donde se recibió el mensaje
            // message: El mensaje recibido (en formato Buffer)
            // Realiza acciones con el mensaje recibido y las medidas obtenidas       
            var jsonDataConv = JSON.parse(message.toString());
            // Envía el mensaje procesado a la salida correspondiente
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
                // Envía el mensaje a la salida correspondiente
                console.log(msgRt);
                console.log(msgMqtt);
                console.log(msgBootSys);
                console.log(msgConn1);
                console.log(msgConn2);
                node.send([msgRt, msgMqtt, msgBootSys, msgConn1, msgConn2]);
            }else{
                publishTopic(topicSetRt, payloadRt,qos)
            }

        });
        // Manejador de cierre del nodo
        node.on('close', function(done) {
            // Cierra la conexión MQTT solo si este nodo es el último en usarla
            if (client && client.connected) {
                client.end(done);
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType("viaris",ViarisNode);
}
