# node-red-viaris
Project focused on a Node-RED Node development for MQTT Communications with Viaris Chargers

![image](https://github.com/orbis-developers/viaris_node_red/assets/66405397/9093499c-4c55-4a5f-8dd4-435b23f3eba7)


## Installation

- **Install via Node-RED Manage Palette**

![image](https://github.com/orbis-developers/viaris_node_red/assets/66405397/3648380a-e44a-4543-89fc-65d299ba33d9)


- **Install via npm**

```
npm install @orbis-developers/node-red-viaris

```

After installation you will find the node inside the Node-RED palette.

![image](https://github.com/orbis-developers/viaris_node_red/assets/66405397/c2d39cd2-e579-420d-8042-c98d87ecd671)

## Input configuration
node-red-viaris has to be configured with the charger serial number and the right broker mqtt credentials.

![image](https://github.com/orbis-developers/viaris_node_red/assets/66405397/d51a18f1-ce23-42a2-bd5c-ce9f04757cfc)


## Inputs/Outputs node
node-red-viaris features an input where user can provide these functions using an inject node:
- Control the start and stop of charging,
- Configure the update time of the measurements programming a period and timeout.
- Modify the current limit of the connectors.
  
Additionally, it offers five separate outputs that provide monitoring capabilities.

![image](https://github.com/orbis-developers/viaris_node_red/assets/66405397/6ef1ea0a-79c6-47ae-a5e6-c01fb24601bb)


## Predefined Examples

This integration includes predefined examples to streamline the setup process. You can directly import these examples into Node-RED for quick configuration.

![image](https://github.com/orbis-developers/viaris_node_red/assets/66405397/a850850e-c6aa-40da-8a74-b83ff72141fa)


## General information
On the help tab you can find detailed information about viaris node

![image](https://github.com/orbis-developers/viaris_node_red/assets/66405397/3fb2601c-793d-473e-9aaa-4e859e18b6b5)

## Dashboard
Node-RED has the possibility of representing the data obtained by the node in a more visual format through the dashboard.

![imagen](https://github.com/orbis-developers/viaris_node_red/assets/66405397/00811601-3f1c-4e07-a865-b0f5c6b498cd)


![imagen](https://github.com/orbis-developers/viaris_node_red/assets/66405397/a0c274f2-4007-4eb0-8527-74c62ed4e555)

