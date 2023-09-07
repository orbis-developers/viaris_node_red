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
        case 14:
            state="schuko ON, load";
            break;
        case 13:
            state="schuko ON, not load";
            break;
        case 31:
            state="schuko OFF";
            break;
    }
    return state;
}

function loadMennParam(topic, jsonData){
    var msg = {
        topic: topic,
        payload: {
            "user": jsonData.data.stat.user,
            "state_menn": stateMennekes(jsonData.data.stat.state),        
        }
    };
    return msg;
}

function loadSchukoParam(topic, jsonData){
    var msg = {
        topic: topic,
        payload: {
            "user": jsonData.data.stat.user,
            "state_schuko": stateSchuko(jsonData.data.stat.state),        
        }
    };
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
function publishTopic(clientMqtt, topic, mensaje){
    clientMqtt.publish(topic, mensaje, function (err) {
        if (err) {
          console.error('Error al publicar el mensaje:', err);
        } else {
          console.log('Topic MQTT publicado:', topic);
          console.log('Payload MQTT publicado:', mensaje);
        }
    });
}
module.exports = function(RED) {
    function ViarisNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var serialNumber = config.serialNumber;
        var brokerServer = config.brokerServer;
        var username = config.username;
        var password = config.password;
        // Configura los detalles de conexión MQTT
        var mqttOptions = {
            clientId: 'ViarisClient',   // Nombre del cliente MQTT
            username: username,         // Usuario (si es necesario)
            password: password          // Contraseña (si es necesario)
        };
        brokerServer = "mqtt://" + brokerServer;
        // Crea una conexión MQTT
        var client = mqtt.connect(brokerServer, mqttOptions);
        
        // Suscripción a los topics
        var shortSerialNumber = "0" + serialNumber.slice(-5);
        var topicToSubscribe_rt = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/streamrt/modulator';
        var topicToSubscribe_boot_sys = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/boot/sys';
        var topicToSubscribe_mqtt = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/cfg/mqtt_user';
        var topicToSubscribe_menk = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/mennekes';
        var topicToSubscribe_schuko = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/value/evsm/schuko';
        var topicToSubscribe_init_boot_sys = 'XEO/VIARIS/'+ shortSerialNumber + '/stat/0/' + serialNumber + '/init_boot/sys';
        // Topics de publicación
        var topicSetRt = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/rt/modulator';
        var payloadRt = '{"idTrans": 0,"data": {"status": true,"period": 5,"timeout": 10000}}';
        var topicGetMqtt = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/cfg/mqtt_user';
        var topicGetMenn = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/mennekes';
        var topicGetSchuko = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/value/evsm/schuko';
        var topicGetSysBoot = 'XEO/VIARIS/' + shortSerialNumber + '/get/0/' + serialNumber + '/boot/sys';
        var payloadGet = '{"idTrans": 0}'
        var topicStartStop = 'XEO/VIARIS/' + shortSerialNumber + '/set/0/' + serialNumber + '/request/reqman/mennekes';
        var payloadStart = '{"idTrans":49685,"header":{"timestamp":1665381726837, "heapFree":0}, "data":{"uid":1, "source":"app", "priority":0,"action":1,"user":"","group":0}}';
        var payloadStop = '{"idTrans":49685,"header":{"timestamp":1665381726837, "heapFree":0}, "data":{"uid":1, "source":"app", "priority":0,"action":0,"user":"","group":0}}';
        node.on('input', function(msg) {
            console.log(msg.payload);
            if(msg.payload==="Start"){
                publishTopic(client, topicStartStop, payloadStart);   
            }else if(msg.payload==="Stop"){
                publishTopic(client, topicStartStop, payloadStop);     
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
            subscribeTopics(client, topicToSubscribe_menk);   
            subscribeTopics(client, topicToSubscribe_schuko);  
            // Publicación de topics
            publishTopic(client, topicGetMqtt, payloadGet); 
            publishTopic(client, topicGetMenn, payloadGet);
            publishTopic(client, topicGetSysBoot, payloadGet);
            publishTopic(client, topicGetSchuko, payloadGet);
            publishTopic(client, topicSetRt, payloadRt);
            // Publicación síncrona de topics tipo get
            setInterval(function() {publishTopic(client, topicGetMqtt, payloadGet);}, 6000);        // 6000 milisegundos  
            setInterval(function() {publishTopic(client, topicGetMenn, payloadGet);}, 4000);        // 4000 milisegundos  
            setInterval(function() {publishTopic(client, topicGetSysBoot, payloadGet);}, 7000);     // 7000 milisegundos  
            setInterval(function() {publishTopic(client, topicGetSchuko, payloadGet);}, 5000);      // 5000 milisegundos
            // Publicación síncrona de topics tipo set
            setInterval(function() {publishTopic(client, topicSetRt, payloadRt);}, 10000);          // 10000 milisegundos
        });
        client.on('close', function() {
            node.status({ fill: "red", shape: "dot", text: "MQTT disconnected" });
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
            var msgMenn = null;
            var msgMqtt = null;
            var msgSchuko = null;
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
                    case topicToSubscribe_menk:
                        msgMenn=loadMennParam(topic, jsonDataConv);
                        break;
                    case topicToSubscribe_schuko:
                        msgSchuko=loadSchukoParam(topic, jsonDataConv);
                        break;
                }     
                // Envía el mensaje a la salida correspondiente
                console.log(msgRt);
                console.log(msgMqtt);
                console.log(msgBootSys);
                console.log(msgMenn);
                console.log(msgSchuko);
                node.send([msgRt, msgMqtt, msgBootSys, msgMenn, msgSchuko]);
            }else{
                publishTopic(topicSetRt, payloadRt)
            }

        });

        // Manejador de cierre del nodo
        node.on('close', function(done) {
            // Cierra la conexión MQTT antes de que el nodo se cierre
            client.end(done);
        });
    }
    RED.nodes.registerType("viaris-node-red",ViarisNode);
}
