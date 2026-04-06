# Netra System Architecture Flow and Component Coupling

## Overview
The Netra emergency response system consists of three interconnected components that work together to detect accidents, coordinate emergency response, and provide situational awareness. This document explains how these components interact and couple to form a cohesive system.

## Component Relationships

### 1. Accident Detection ↔ Dashboard (Primary Coupling)
**Direction**: Bidirectional via REST API
**Protocol**: HTTP/REST (Flask endpoints)
**Data Flow**:
- **Accident Detection → Dashboard**: 
  - Exposes `/api/alerts` endpoint for dashboard to fetch alert data
  - Provides `/dashboard` route for serving frontend (though dashboard likely runs separately)
  - Sends alert metadata (location, timestamp, status, image paths)
- **Dashboard → Accident Detection**:
  - Consumes `/api/alerts` to display real-time accident data
  - May send status updates via `/update_status` (though this appears less likely in current implementation)
  - Uses alert data for map visualization, analytics, and notifications

**Coupling Mechanism**: 
- Dashboard makes periodic HTTP GET requests to `/api/alerts`
- Accident Detection backend serves JSON-formatted alert data
- Loose coupling through well-defined API contract

### 2. Emergency Control Unit ↔ Accident Detection (Potential Coupling)
**Direction**: Unidirectional (Detection → Accident Detection)
**Protocol**: Likely HTTP/REST (to be implemented)
**Data Flow**:
- **Detection → Accident Detection**:
  - ECU's detection module (`detection.py`) would identify accidents from video/sensor feeds
  - Sends POST requests to Accident Detection's `/alert` endpoint
  - Transmits accident details (coordinates, timestamp, image path, address)

**Current State**: 
- `detection.py` is currently empty - this coupling is planned but not implemented
- Would establish Accident Detection as the central alert repository

**Future Coupling Mechanism**:
- ECU detection algorithms would trigger HTTP POST to `/alert`
- Accident Detection would validate and store incoming alerts
- Decouples detection logic from alert management/storage

### 3. Emergency Control Unit ↔ Dashboard (Secondary Coupling)
**Direction**: Bidirectional via shared services
**Protocol**: Potentially Firebase/WebSocket or shared backend
**Data Flow**:
- Both components may share:
  - Real-time accident data (via Firebase or polling Accident Detection)
  - Ambulance location/status information
  - Map visualization data
  - System status indicators

**Coupling Mechanism**:
- Through shared Firebase backend (both reference Firebase in dependencies)
- Potential WebSocket connections for real-time updates
- Common data sources rather than direct component-to-component communication

### 4. Emergency Control Unit ↔ Ambulances (Direct Coupling)
**Direction**: Bidirectional via WebSocket
**Protocol**: Socket.IO WebSocket
**Data Flow**:
- **Ambulance → ECU**:
  - Sends `register-ambulance` event when coming online
  - Maintains persistent connection for command reception
- **ECU → Ambulance**:
  - Emits `trigger-assigned` events with dispatch instructions
  - Sends real-time updates and routing information

**Coupling Mechanism**:
- Persistent Socket.IO connections for low-latency communication
- Event-based messaging for ambulance registration and command delivery
- Room-based targeting for specific ambulance communication

## Data Flow Scenarios

### Scenario 1: Accident Detection and Response
1. **Detection Phase**: 
   - ECU's computer vision detects potential accident
   - Sends alert data to Accident Detection backend via `/alert` POST
   
2. **Storage & Notification**:
   - Accident Detection stores alert, assigns ID, timestamps it
   - Makes alert available via `/api/alerts` endpoint
   
3. **Visualization**:
   - Dashboard polls `/api/alerts` or receives Firebase updates
   - Displays new accident on map with details
   - Shows toast notification to operators
   
4. **Response Coordination**:
   - Operators view accident details on Dashboard
   - May use ECU interface to dispatch ambulances
   - ECU sends `trigger-assigned` via Socket.IO to specific ambulances
   
5. **Status Updates**:
   - As ambulances respond, status may be updated via Dashboard
   - Dashboard sends updates to Accident Detection via `/update_status`
   - Updated status reflected in all connected clients

### Scenario 2: Monitoring and Situational Awareness
1. **Continuous Monitoring**:
   - Dashboard continuously displays live accident map
   - ECU interface shows ambulance locations and availability
   - Both pull from shared data sources (Accident Detection API + Firebase)
   
2. **Resource Management**:
   - Operators monitor accident trends via Dashboard analytics
   - Dispatchers manage ambulance fleet via ECU interface
   - Cross-component visibility enables informed decision-making

## Architectural Patterns

### 1. Centralized Data Repository
- **Accident Detection** serves as the central store for all accident alerts
- Other components consume data from this source rather than maintaining duplicate states
- Ensures data consistency and single source of truth for accident information

### 2. Decoupled Communication Layers
- **REST APIs** for non-real-time data exchange (Accident Detection ↔ Dashboard)
- **WebSockets** for real-time bidirectional communication (ECU ↔ Ambulances)
- **Shared services** (Firebase) for components needing synchronized state
- Appropriate coupling mechanism for each interaction type

### 3. Microservice-inspired Design
- Each component has distinct responsibility:
  - Accident Detection: Alert ingestion and management
  - Dashboard: Visualization and operator interface
  - ECU: Response coordination and ambulance communication
- Independent deployment and scaling potential
- Technology heterogeneity (Python backend, React frontend, SocketIO real-time)

### 4. Event-Driven Response Coordination
- Ambulance registration/deregistration as connection events
- Trigger assignments as emitted events
- Real-time status updates pushed to connected clients
- Low-latency critical path for emergency response

## Integration Points and Interfaces

### Exposed Interfaces:
1. **Accident Detection API**:
   - `POST /alert` - Receive new accident reports
   - `GET /api/alerts` - Retrieve all alerts
   - `GET /dashboard` - Serve dashboard interface
   - `POST /update_status` - Modify alert status

2. **Emergency Control Unit Socket.IO Events**:
   - `register-ambulance` - Ambulance comes online
   - `disconnect` - Ambulance goes offline
   - `ambulance-operate` - Dispatch command received
   - `trigger-assigned` - Dispatch instruction sent

3. **Dashboard Consumption**:
   - GET requests to Accident Detection's `/api/alerts`
   - Firebase real-time subscriptions (as configured)
   - Map tile services (Leaflet providers)
   - Toast notification system

## Data Models and Shared Concepts

### Alert Data Model (Central Shared Structure):
```javascript
{
  id: integer,
  latitude: float,
  longitude: float,
  timestamp: string,
  status: string ('accident_detected'|'under_review'|'resolved'),
  image_path: string (optional),
  address: string,
  acknowledged: boolean
}
```

### Ambulance State (ECU-managed):
```javascript
{
  ambulanceId: string,
  socketId: string (session identifier),
  lastSeen: timestamp,
  status: string ('available'|'en_route'|'on_scene'|'returning'),
  currentLocation: {latitude, longitude}
}
```

## Deployment and Scaling Considerations

### Independent Scaling:
- Accident Detection backend can scale based on alert ingestion volume
- Dashboard instances can scale based on concurrent operator count
- ECU instances can scale based on ambulance fleet size and message throughput

### Deployment Options:
- **Monolithic**: All components on single server (current dev setup)
- **Separated**: Each component on dedicated infrastructure
- **Cloud-native**: Containerized deployment with load balancing
- **Edge deployment**: Detection units at edge, central backend in cloud

### Communication Resilience:
- HTTP retries for Accident Detection ↔ Dashboard
- WebSocket reconnection logic for ECU ↔ Ambulances
- Fallback polling mechanisms for real-time updates
- Offline buffering capabilities (planned for detection module)

## Security Considerations

### Authentication and Authorization:
- Currently minimal authentication in prototype
- Production would need:
  - API key authentication for Accident Detection endpoints
  - Secure WebSocket connections (WSS://) for ECU
  - Role-based access for Dashboard operators
  - JWT tokens for service-to-service communication

### Data Protection:
- HTTPS for all external communications
- Sanitization of input data to prevent injection
- Secure handling of location and image data
- Audit trails for alert status changes

## Summary of Component Coupling

The Netra system employs a **layered coupling approach** where:
1. **Tight coupling** exists only where necessary for real-time operations (ECU ↔ Ambulances via WebSocket)
2. **Loose coupling** through well-defined APIs for asynchronous interactions (Dashboard ↔ Accident Detection via REST)
3. **Shared services** facilitate coordination between components with similar real-time needs (both Dashboard and ECU may use Firebase)
4. **Clear boundaries** ensure each component maintains a single responsibility while contributing to the overall emergency response workflow

This architecture provides:
- **Resilience**: Failure in one component doesn't necessarily crash others
- **Flexibility**: Components can be updated/replaced independently
- **Scalability**: Each layer can scale based on its specific load profile
- **Maintainability**: Clear interfaces reduce cognitive load for developers
- **Effectiveness**: Appropriate communication patterns for each use case (real-time command vs. status visualization)

The system successfully bridges the gap between passive accident detection and active emergency response through thoughtful component coupling that matches communication patterns to operational requirements.