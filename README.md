# 12MP DAKboard Automation

## Overview

12MP DAKboard Automation is a web-based display system designed to run a live operational dashboard on a TV or other large-format screen through **DAKboard**.

The system combines:

- A web application hosted on **Vercel**
- A **Turso/SQLite-compatible database** for operational data
- A DAKboard display that loads the web application as an **iframe**
- A **Raspberry Pi** connected to the display/TV and used to present the DAKboard screen
- Administrative controls for managing display assignments, dates, schedules, games, and related information

> **Important:** This setup does **not** use Docker. The production display is not a Docker container. DAKboard simply embeds the deployed Vercel website as an iframe.

---

## How Everything Fits Together

```text
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │     Vercel      │
              │  Web Application│
              └────────┬────────┘
                       │
                       │ Database/API requests
                       ▼
              ┌─────────────────┐
              │      Turso      │
              │ Operational DB  │
              └────────┬────────┘
                       │
                       │
                       ▼
              ┌─────────────────┐
              │     DAKboard    │
              │  iframe/web URL │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Raspberry Pi   │
              │  Browser/Display│
              └────────┬────────┘
                       │ HDMI
                       ▼
                  TV / Monitor
```

The Raspberry Pi does not need to host the application itself. Its primary job is to display the DAKboard page on the attached TV/monitor.

---

# Main Components

## 1. Vercel Web Application

The application is deployed to Vercel and provides the actual dashboard interface.

The Vercel application handles:

- Display pages
- Control-room views
- Administrative pages
- Date selection
- Display assignments
- Game information
- Crew/shift information
- Schedule information
- Data synchronization
- Database/API communication

The application is accessed through a normal HTTPS URL.

That URL is what DAKboard loads.

### Production relationship

```text
Vercel URL
     │
     ▼
DAKboard iframe
     │
     ▼
Raspberry Pi browser
     │
     ▼
TV
```

There is no local web server required on the Raspberry Pi for the application.

---

# 2. DAKboard

DAKboard is the display/layout layer.

The DAKboard configuration contains an **iframe/webpage block** pointing to the deployed Vercel application.

For example, conceptually:

```text
DAKboard
└── Custom iframe / webpage
    └── https://<your-vercel-site>
```

DAKboard provides the surrounding display environment while the Vercel application provides the actual 12MP dashboard content.

### DAKboard responsibilities

DAKboard is responsible for:

- Loading the webpage
- Keeping the dashboard displayed
- Providing the screen/layout environment
- Presenting the web application on the configured display

### Application responsibilities

The Vercel application is responsible for:

- Dashboard content
- Business logic
- Database access
- Game/crew/schedule data
- Administrative controls
- Date and display configuration

---

# 3. Raspberry Pi

The Raspberry Pi acts as the physical display computer.

A typical setup is:

```text
Raspberry Pi
    │
    ├── Ethernet / Wi-Fi
    │
    ├── Web browser
    │
    └── HDMI
          │
          ▼
        TV
```

The Pi loads DAKboard, and DAKboard loads the Vercel application.

The Pi therefore does not need:

- Docker
- Node.js for the production display
- The project source code
- A local database
- A local copy of the Vercel application

The Pi primarily needs a reliable network connection, a supported browser/display environment, and HDMI output.

---

# 4. Database

The application uses a remote database for the dashboard's operational data.

The database contains information such as:

- Displays
- Display assignments
- Games
- Shifts
- Crew information
- Position mappings
- Schedule templates
- Application settings
- Import/synchronization information

The Vercel application communicates with the database through its server-side API routes.

The Raspberry Pi and DAKboard do not directly access the database.

---

# Dashboard Workflow

When the physical display starts:

1. Raspberry Pi boots.
2. The Pi loads DAKboard.
3. DAKboard loads the configured iframe/web URL.
4. The Vercel application loads.
5. The application retrieves the necessary dashboard information.
6. The dashboard renders on the TV.

Conceptually:

```text
Pi boots
   ↓
DAKboard loads
   ↓
Vercel webpage loads
   ↓
Application loads dashboard data
   ↓
Dashboard appears on TV
```

---

# Administrative Workflow

The administrative interface is used to manage the information shown on the displays.

Typical operations include:

- Selecting the display date
- Assigning displays
- Managing games
- Viewing/importing schedule information
- Managing crew/shift information
- Rebuilding or synchronizing data
- Managing display-specific configuration

Administrative users interact directly with the Vercel application through a browser.

The resulting changes are stored in the database and are then available to the display pages.

---

# Display Date

The system supports a display-date override.

This allows the dashboard to show a specific operational date rather than automatically using today's date.

This is useful when preparing a display in advance or when the physical display needs to show information for a particular event/day.

The selected date is stored as application configuration and is read by the dashboard.

---

# Performance Considerations

The dashboard is a live web application, so its responsiveness depends on several pieces:

```text
Raspberry Pi
     ↓
Network
     ↓
DAKboard
     ↓
Vercel
     ↓
Database
```

A slow database request or a slow network request can therefore appear to the user as a dashboard that is "hanging."

The application has been structured to minimize unnecessary database requests and avoid making multiple sequential requests when a batched request can be used.

In particular, date changes should update the user interface immediately rather than waiting for a complete dashboard reload.

---

# Raspberry Pi Display Recommendations

For a reliable always-on display:

- Use a stable wired Ethernet connection when practical.
- Use a reliable power supply.
- Disable unnecessary desktop applications.
- Keep the browser dedicated to DAKboard.
- Configure the Pi to automatically restart/recover after power loss.
- Configure the browser/DAKboard to automatically reopen after reboot.
- Keep the Raspberry Pi OS and browser reasonably current.
- Avoid using the Pi as a general-purpose workstation while it is serving as the display.

For a wall-mounted or permanently installed display, reliability is generally more important than maximum desktop performance.

---

# Network Requirements

The display system requires Internet access because the production application is hosted remotely.

The basic dependency chain is:

```text
Raspberry Pi
    ↓
Internet
    ↓
DAKboard
    ↓
Vercel
    ↓
Database
```

If the Internet connection is unavailable, the live application may not be able to retrieve updated information.

---

# Troubleshooting

## Screen is blank

Check:

1. Is the Raspberry Pi powered on?
2. Is the TV/monitor receiving HDMI input?
3. Does the Pi have network connectivity?
4. Does DAKboard load?
5. Does the Vercel URL open directly in a browser?
6. Is the iframe/webpage URL still correct?

---

## DAKboard loads but the dashboard does not

Open the Vercel URL directly from another computer.

If the Vercel site works normally, check the DAKboard iframe configuration.

If the Vercel site does not work, the issue is likely with the application deployment or backend/database connection rather than the Raspberry Pi.

---

## Dashboard is slow

Check the following in order:

1. Internet connection
2. Raspberry Pi network connection
3. Vercel application response time
4. Database response time
5. Number of data requests made by the dashboard

A slow dashboard does not necessarily indicate a Raspberry Pi performance problem.

Because the application runs on Vercel, much of the application processing happens remotely.

---

## Date changes slowly

The date selector should not require a full page reload.

If date changes become slow again, check for code that:

- Reloads all dashboard data after changing the date
- Makes several database requests sequentially
- Waits for database confirmation before updating the interface
- Starts multiple refresh operations simultaneously

The preferred behavior is:

```text
User selects date
      ↓
UI changes immediately
      ↓
Save date in background
      ↓
Only refresh data when actually necessary
```

---

# Deployment Model

The production system is intentionally simple:

```text
             ┌──────────────┐
             │   Database   │
             └──────▲───────┘
                    │
                    │
             ┌──────┴───────┐
             │    Vercel    │
             │ Web App/API  │
             └──────▲───────┘
                    │ HTTPS
                    │
             ┌──────┴───────┐
             │   DAKboard   │
             │    iframe    │
             └──────▲───────┘
                    │
             ┌──────┴───────┐
             │ Raspberry Pi │
             └──────▲───────┘
                    │ HDMI
                    │
             ┌──────┴───────┐
             │   TV/Monitor │
             └──────────────┘
```

## Docker

**Docker is not part of the production architecture.**

There is no Docker container running on the Raspberry Pi.

There is no requirement to run the Vercel application inside Docker.

The production application is hosted by Vercel and embedded into DAKboard.

---

# Project Purpose

The overall purpose of the system is to provide a reliable, remotely managed operational dashboard that can be displayed on a large-format screen without requiring the display computer to host or maintain the application itself.

This separation provides a useful division of responsibilities:

| Component | Primary purpose |
|---|---|
| **Vercel** | Hosts the application |
| **Database** | Stores operational data |
| **DAKboard** | Provides the display/iframe environment |
| **Raspberry Pi** | Physically drives the display |
| **TV/Monitor** | Shows the dashboard |

---

# At a Glance

**Application:** Vercel-hosted web application

**Display platform:** DAKboard

**Physical computer:** Raspberry Pi

**Screen:** TV / large-format monitor

**Database:** Remote database

**Integration:** DAKboard iframe → Vercel HTTPS site

**Docker:** Not used

**Local application server on Pi:** Not required

**Internet:** Required for live application/database access

**Primary purpose:** Automated operational information display on a large screen
