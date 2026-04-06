# Accident Detection System Explanation

## Overview
The Accident Detection component serves as the backend service for collecting, storing, and managing accident alerts in the Netra emergency response system.

## Key Functionality

### Alert Reception
- Exposes a REST API endpoint (`/alert`) that accepts POST requests containing accident detection data
- Processes JSON payloads with location coordinates, timestamps, status information, and image paths
- Assigns unique sequential IDs to each incoming alert
- Stores alerts in an in-memory list with acknowledgment status tracking

### Alert Management
- Maintains chronological ordering of alerts (newest first)
- Provides dashboard interface (`/dashboard`) for visualization
- Offers API endpoint (`/api/alerts`) to retrieve all stored alerts with metadata
- Includes status update functionality (`/update_status`) to modify alert states

### Data Persistence
- Uses in-memory storage for alerts (resets on server restart)
- Creates static directory structure for storing detected frame images
- Generates sample data for testing and demonstration purposes

### Technical Implementation
- Built with Flask web framework
- Runs on port 5000 with debug mode enabled
- Hosts on all network interfaces (0.0.0.0) for accessibility
- Includes CORS considerations for frontend integration

## Role in System
This component acts as the central data repository and API gateway for accident information, bridging the gap between detection algorithms (potentially in the emergency control unit) and the user-facing dashboard interface.