# Netra Dashboard Explanation

## Overview
The Netra Dashboard is the frontend user interface component of the emergency response system, built with React, TypeScript, and Vite to provide real-time visualization of accident alerts and system status.

## Key Features

### Technology Stack
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite for fast development and production builds
- **Styling**: Tailwind CSS for responsive, utility-first design
- **State Management**: Likely uses React Context or similar (inferred from dependencies)
- **Mapping Integration**: Leaflet with React-Leaflet for geographic visualization
- **Notifications**: React-Toastify for user alerts and notifications
- **Data Visualization**: Recharts for analytical components
- **Backend Communication**: Firebase integration for real-time data synchronization

### Core Capabilities
1. **Real-time Alert Display**: Shows incoming accident alerts with location mapping
2. **Geographic Visualization**: Interactive maps using Leaflet to pinpoint accident locations
3. **Status Tracking**: Visual representation of alert statuses (detected, under review, resolved)
4. **Analytics Dashboard**: Charts and graphs for monitoring incident trends
5. **Notification System**: Toast notifications for new alerts and status changes
6. **Responsive Design**: Mobile-friendly interface accessible across devices

### Development Workflow
- **Development Server**: `npm run dev` starts Vite dev server with HMR
- **Production Build**: `npm run build` compiles TypeScript and optimizes assets
- **Preview**: `npm run preview` tests production build locally
- **Linting**: ESLint with React and TypeScript plugins for code quality

### Project Structure
- `src/`: Contains all React components, hooks, and application logic
- `public/`: Static assets and HTML template
- Configuration files for Tailwind, TypeScript, Vite, and ESLint

## Role in System
The dashboard serves as the primary interface for emergency responders, operators, and administrators to:
- Monitor incoming accident detections in real-time
- Visualize incident locations on interactive maps
- Track the status and progression of emergency responses
- Access analytical insights about incident patterns
- Coordinate response efforts through visual feedback

This frontend component consumes data from the Accident Detection backend API and potentially integrates with Firebase for real-time updates, providing a comprehensive situational awareness display for emergency management.