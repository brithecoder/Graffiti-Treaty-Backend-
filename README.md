# 🎨 Treaty Mural Engine | Backend

The backbone of a real-time, collaborative graffiti experience. This server manages high-frequency stroke data, synchronized session timers, and multi-user room states using Node.js, Socket.io, and MongoDB.

## 🚀 Core Features
**Real-time Synchronization:** Sub-100ms latency for stroke distribution across all artists in a room.

**Late-Joiner Reconciliation:** Automatic state recovery for users joining sessions already in progress.

**State-Managed Rooms:** Distinct logic for "Lobby", "Active", and "Finished" wall states.

**Automated Session Lifecycle:** Server-side timers ensure all clients end sessions and transition to "Reveal" mode simultaneously.

## 🛠 Tech Stack
**Runtime:** Node.js

**Framework:** Express

**Communication:** Socket.io (WebSockets)

**Database:** MongoDB (via Mongoose)

**State Management:** Memory-mapped slot assignment for artist quadrants.

## 📡 Socket.io Inbound Events
The following events are emitted from the **Client** and handled by the **Server**:

| Event | Payload | Description |
| :--- | :--- | :--- |
| `join_wall` | `{ wallCode, artistName }` | Joins a socket room and triggers a database lookup or creation of the wall record. |
| `start_mission` | `{ wallCode, durationSeconds }` | Updates the wall status to `active` in the DB and broadcasts the start signal to all connected artists. |
| `send_stroke` | `{ wallCode, path, color, ... }` | Receives coordinate and style data and broadcasts it to all other artists in the same room. |
| `clear_quadrant` | `{ wallCode, artistName }` | Removes all strokes associated with a specific user's quadrant from the database and canvas. |

## 📡 Socket.io Outbound Events

These events are emitted from the **Server** to the **Client** to synchronize the session state across all participants:

| Event | Payload | Description |
| :--- | :--- | :--- |
| `already_started` | `{ finishAt, muralName }` | Sent to late joiners to force Spectator Mode and sync timers. |
| `mission_start_confirmed` | `{ finishAt }` | Signals the transition from Lobby to Canvas for all users. |
| `receive_stroke` | `{ strokeData }` | Delivers real-time drawing data from one artist to all peer clients. |
| `mission_ended` | `void` | Triggers the global transition to the Reveal screen for everyone in the room. |

---

## 🗄 Database Models

### Wall Schema
Maintains the "Source of Truth" for every graffiti session.

```javascript
{
  wallCode: String,     // Unique 4-character ID
  status: String,       // 'waiting', 'active', or 'finished'
  muralName: String,
  finishAt: Number,     // Unix timestamp for session end
  isStarted: Boolean
}
```
### Stroke Schema
Persistent storage for every line drawn, allowing for canvas reconstruction on refresh.

```JavaScript
{
  wallCode: String,
  artistName: String,
  points: Array,
  color: String,
  brushSize: Number,
  timestamp: Date
}
```
## ⚙️ Setup & Installation
Follow these steps to get the backend environment running locally:

**1. Clone the repository**
```Bash
git clone [your-repo-link]
cd treaty-backend
```
**2. Install dependencies**
```Bash
npm install
```
**3. Environment Configuration**
Create a .env file in the root directory and add the following:

```Code snippet
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
```
**4. Run the server**
```Bash
npm start
```

