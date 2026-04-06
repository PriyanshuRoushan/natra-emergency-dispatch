# Emergency Control Unit Explanation

## Overview
The Emergency Control Unit (ECU) is the coordination center of the Netra emergency response system, responsible for managing ambulance dispatch, real-time communication with emergency vehicles, and integrating accident detection data with response operations.

## Key Components

### Core Server Functionality (`app.py`)
- **Technology**: Flask-SocketIO for real-time bidirectional communication
- **Real-time Communication**: Uses WebSocket protocol via Socket.IO for low-latency ambulance communication
- **Connection Management**: Tracks registered ambulances using socket ID mappings
- **Event Handling**: 
  - `register-ambulance`: Registers incoming ambulance connections
  - `disconnect`: Handles ambulance disconnections and cleanup
  - `ambulance-operate`: Processes dispatch commands and triggers

### Ambulance Management
- Maintains active registry of connected ambulances with unique IDs
- Maps ambulance identifiers to Socket.IO session IDs for targeted communication
- Provides connection status monitoring and automatic cleanup of disconnected units
- Emits trigger assignments to specific ambulances based on emergency requirements

### Frontend Interface (`templates/index.html`)
- **Mapping Interface**: Integrated Leaflet maps for geographic visualization
- **Routing Capabilities**: Leaflet Routing Machine for optimal ambulance routing
- **Firebase Integration**: Real-time database synchronization for shared state
- **UI Components**:
  - Ambulance search functionality
  - Interactive map display (600px height)
  - Traffic light information display along routes
  - Accident snapshot viewer with image and location details
- **Styling**: Custom CSS for responsive layout and visual feedback

### Detection Integration (`detection.py`)
- Currently empty file placeholder for accident detection logic
- Intended to house computer vision or sensor-based accident detection algorithms
- Would process video feeds, sensor data, or other inputs to identify potential accidents
- Likely designed to feed detected incidents to the Accident Detection backend

## Technical Implementation
- **Backend**: Python Flask with SocketIO extension
- **Frontend**: HTML/JavaScript with Leaflet mapping library
- **Real-time Protocol**: Socket.IO WebSocket connections
- **External Services**: Firebase for data synchronization, Leaflet for mapping
- **Port Configuration**: Likely runs on default Flask port (5000) or configured port

## Role in System
The Emergency Control Unit serves as the operational hub that:
1. **Receives accident data** from detection systems (potentially feeding into Accident Detection backend)
2. **Manages ambulance fleet** through real-time WebSocket connections
3. **Coordinates emergency responses** by assigning triggers and directing ambulances to incidents
4. **Provides situational awareness** through map-based interfaces showing ambulance locations and incident details
5. **Integrates with navigation systems** for optimal routing to emergency locations
6. **Displays critical information** including accident images, locations, and traffic conditions

This component bridges the gap between passive accident detection and active emergency response, transforming alerts into coordinated life-saving actions through real-time communication and resource management.