# 🌊 Alprog Boncos - For Monitoring System Framework - with Complete Backend System

> **Transform your industrial monitoring dreams into reality!** This isn't just another backend framework - it's your gateway to building robust, real-time monitoring systems that adapt, scale, and never miss a beat.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)]()
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)]()
[![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange.svg)]()
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-purple.svg)]()
[![Electron](https://img.shields.io/badge/Electron-Desktop-lightblue.svg)]()

## 🚀 What Makes This Framework Special?

Imagine having a monitoring system that's as flexible as a Swiss Army knife and as reliable as a lighthouse. This framework brings together the best of multiple worlds with a **clean modular architecture** that makes development a breeze:

- **🧩 Modular Architecture**: Clean separation of concerns across dedicated modules
- **🔄 Dual Database Support**: Switch between MySQL and Firebase with a single command
- **⚡ Real-time Everything**: WebSocket communications that keep your data flowing
- **🔗 Smart Serial Communication**: Auto-reconnecting, self-healing device connections
- **🛡️ Fort Knox Security**: Built-in encryption for sensitive data
- **🖥️ Desktop Ready**: Electron-powered interface for professional deployment
- **📁 Organized Codebase**: Easy to maintain, test, and scale

## 🏗️ New Modular Architecture That Actually Makes Sense

```
┌─────────────────────────────────────────────────────────────────┐
│                 🖥️  Electron Desktop Application                │
├─────────────┬─────────────────┬─────────────────┬───────────────┤
│ 🧩 Modules  │ 💾 Database     │ 🌐 WebSocket    │ 🔌 Serial     │
│ Manager     │    Manager      │    Manager      │    Manager    │
├─────────────┼─────────────────┼─────────────────┼───────────────┤
│ Clean Init  │ MySQL/Firebase  │ Real-time Data  │ Arduino/ESP32 │
│ Lifecycle   │ Query Builder   │ Broadcasting    │ Auto-detection│
│ Error Mgmt  │ Encryption      │ Client Mgmt     │ Smart Reconnect│
└─────────────┴─────────────────┴─────────────────┴───────────────┘
```

## 📁 **NEW Project Structure - Your Roadmap to Success**

Understanding the new modular structure is crucial for efficient development. Here's your complete project anatomy:

```
flow-meter-monitoring/
├── 📋 main.js                          # 🚀 Clean application entry point (60 lines!)
├── 🔗 preload.js                       # 🌉 Bridge between frontend and backend
├── 📦 package.json                     # 📋 Dependencies and scripts
├── 🔐 .env                            # ⚙️ Configuration secrets
├── 🔐 .env.example                    # 📝 Template for environment variables
├── 🔧 firebaseConfig.js               # 🔥 Firebase configuration defaults
├── 📚 README.md                       # 📖 You are here!
│
├── 📂 modules/                        # 🧩 NEW: Modular Architecture
│   ├── 📂 database/                   # 💾 Database Management Module
│   │   └── 🏗️ databaseManager.js     # 📊 Database initialization & lifecycle
│   │
│   ├── 📂 window/                     # 🖥️ Window Management Module  
│   │   └── 🪟 windowManager.js       # 🎯 Electron window creation & management
│   │
│   ├── 📂 api/                        # 🌐 API Server Module
│   │   └── 🚀 apiServer.js           # 🔧 Express server setup & routing
│   │
│   ├── 📂 serial/                     # 🔌 Serial Communication Module
│   │   └── 📡 serialManager.js       # 🎮 Serial device management & lifecycle
│   │
│   └── 📂 ipc/                        # 🌉 IPC Communication Module
│       └── 💬 ipcManager.js          # 🔗 Frontend-backend communication hub
│
├── 📂 lib/                            # 🏗️ Core Framework Libraries (Existing)
│   ├── 📂 db/                         # 💾 Database Abstraction Layer
│   │   ├── 🗄️ mysqlDB.js             # 🐬 MySQL database handler + Query Builder
│   │   └── 🔥 firebaseDB.js          # 🔥 Firebase Realtime DB handler + Query Builder
│   │
│   └── 📂 com/                        # 🌐 Communication Modules  
│       ├── 🔌 serialCommunicator.js   # 📡 Arduino/ESP32/Device communication
│       └── 🌐 webSocketHandler.js     # 💬 Real-time WebSocket server
│
├── 📂 controller/                     # 🎮 Business Logic Controllers (Existing)
│   └── 📂 app/                        # 📱 Application-specific controllers
│       ├── 🔐 authController.js       # 👤 User authentication & JWT handling
│       ├── 🗄️ databaseController.js   # 💾 Generic database operations
│       └── 📱 mauiController.js       # 📲 MAUI/Mobile app integration
│
├── 📂 resource/                       # 🎨 Frontend Resources (Existing)
│   └── 📂 view/                       # 👁️ User Interface Files
│       └── 📂 uibaru/                 # 🎨 New UI Components
│           ├── 🖥️ monitor.html        # 📊 Main monitoring dashboard
│           ├── 🎨 style.css           # 💄 Dashboard styling
│           └── ⚡ script.js           # 🧠 Frontend logic & real-time updates
│
├── 📂 scripts/                        # 🔧 Utility Scripts (Existing)
│   └── 🔄 switch-db.js               # 🎛️ Database switching utility
│
└── 📂 node_modules/                   # 📦 Dependencies (auto-generated)
```

## 🎯 **NEW Modular File Guide - Know What You're Editing**

### 🚀 **Core Application (Simplified!)**

#### `main.js` - The Clean Command Center
```javascript
// 🎯 Purpose: Clean application bootstrap (reduced from 300+ to 60 lines!)
// ✏️ Edit when: Adding new high-level modules, changing app lifecycle
// 🔧 Contains: Module coordination, error handling, app lifecycle

class Application {
    async initialize() {
        // Clean, organized initialization
        this.databaseManager = new DatabaseManager();
        this.windowManager = new WindowManager();
        this.apiServer = new APIServer();
        this.serialManager = new SerialManager();
        this.ipcManager = new IPCManager();
    }
}
```

### 🧩 **NEW Module System (`modules/`)**

#### `modules/database/databaseManager.js` - Database Orchestrator
```javascript
// 🎯 Purpose: Clean database initialization and lifecycle management
// ✏️ Edit when: Changing database providers, adding connection logic
// 🔧 Contains: DB initialization, connection management, provider switching

class DatabaseManager {
    async initialize() {
        // Handles both MySQL and Firebase initialization
        // Clean error handling and logging
        // Environment-based configuration
    }
    
    getDatabase() { return this.db; }
    async close() { /* Clean shutdown */ }
}

// Key sections to modify:
- initialize()              // Add new database providers
- getDatabase()            // Modify database access patterns
- close()                  // Add cleanup logic
```

#### `modules/window/windowManager.js` - Window Maestro
```javascript
// 🎯 Purpose: Electron window creation and management
// ✏️ Edit when: Changing window behavior, adding new windows
// 🔧 Contains: Window configuration, lifecycle management

class WindowManager {
    createWindow() {
        // Clean window setup
        // Fullscreen configuration
        // Event handling
    }
    
    getMainWindow() { return this.mainWindow; }
}

// Key sections to modify:
- createWindow()           // Modify window properties
- Window event handlers    // Add new window behaviors
```

#### `modules/api/apiServer.js` - API Command Center
```javascript
// 🎯 Purpose: Express API server setup and route management
// ✏️ Edit when: Adding new routes, middleware, or API features
// 🔧 Contains: Route setup, middleware configuration, controller initialization

class APIServer {
    setupRoutes() {
        // Authentication routes
        this.app.post('/api/auth/register', authController.register);
        this.app.post('/api/auth/login', authController.login);
        
        // Data routes
        this.app.post('/api/sensor-data', dbController.insertSensorData);
    }
}

// Key sections to modify:
- setupRoutes()            // Add new API endpoints
- setupMiddleware()        // Add new middleware
- initializeControllers()  // Wire up new controllers
```

#### `modules/serial/serialManager.js` - Hardware Communication Hub
```javascript
// 🎯 Purpose: Serial device management and lifecycle
// ✏️ Edit when: Adding device types, changing communication protocols
// 🔧 Contains: Serial configuration, connection management, data handling

class SerialManager {
    async initialize() {
        // Clean serial communicator setup
        // Configuration from environment
        // Automatic connection handling
    }
    
    getStatus() { /* Connection status */ }
    async forceReconnect() { /* Reconnection logic */ }
}

// Key sections to modify:
- getSerialConfig()        // Add new serial configurations
- initialize()             // Modify connection logic
- Device management methods // Add new device operations
```

#### `modules/ipc/ipcManager.js` - Communication Bridge
```javascript
// 🎯 Purpose: Organized IPC handler management
// ✏️ Edit when: Adding new frontend-backend communications
// 🔧 Contains: Database IPC handlers, Serial IPC handlers

class IPCManager {
    setupHandlers() {
        this.setupDatabaseHandlers();
        this.setupSerialHandlers();
    }
    
    setupDatabaseHandlers() {
        // All database-related IPC handlers
        ipcMain.handle('get-users', async () => { /* */ });
        ipcMain.handle('post-data', async (event, table, data) => { /* */ });
    }
}

// Key sections to modify:
- setupDatabaseHandlers()  // Add new database IPC methods
- setupSerialHandlers()    // Add new serial IPC methods
- Add new handler groups   // Organize by feature
```

### 🏗️ **Core Libraries (Enhanced but Unchanged)**

#### `lib/db/mysqlDB.js` & `lib/db/firebaseDB.js` - Database Powerhouses
```javascript
// 🎯 Purpose: Database operations with advanced Query Builder (unchanged)
// ✏️ Edit when: Adding custom query methods, modifying encryption
// 🔧 Contains: Query Builder, connection management, encryption

// Still the same powerful Query Builder:
const users = await db.table('users')
    .where('status', 'active')
    .orderBy('created_at', 'desc')
    .limit(10)
    .get();
```

#### `lib/com/serialCommunicator.js` & `lib/com/webSocketHandler.js` - Communication Layer
```javascript
// 🎯 Purpose: Hardware communication and WebSocket management (unchanged)
// ✏️ Edit when: Adding protocols, changing data formats
// 🔧 Contains: Device communication, real-time broadcasting

// Same powerful serial communication:
const serialComm = new SerialCommunicator(config, db, mainWindow);
```

## 🎯 **Benefits of the New Modular Structure**

### 📈 **Development Benefits**
- **🧹 Cleaner Code**: main.js reduced from 300+ lines to ~60 lines
- **🔍 Easy Debugging**: Issues isolated to specific modules
- **⚡ Faster Development**: Know exactly where to make changes
- **🧪 Better Testing**: Test each module independently

### 🔧 **Maintenance Benefits**
- **📦 Separation of Concerns**: Each module has one responsibility
- **🔄 Easy Updates**: Update database logic without touching API code
- **🛠️ Modular Development**: Work on features in isolation
- **🎯 Clear Structure**: New developers onboard faster

### 🚀 **Scalability Benefits**
- **➕ Easy Extension**: Add new modules without refactoring
- **🔀 Swappable Components**: Replace modules with different implementations
- **🏗️ Team Development**: Different teams can work on different modules
- **📊 Performance Monitoring**: Monitor each module's performance separately

## 🎯 Quick Start - Get Running in Minutes!

### 1. **Clone & Install**
```bash
git clone <your-repo>
cd flow-meter-monitoring
npm install
```

### 2. **Choose Your Database Adventure**
```bash
# Want the reliability of MySQL?
npm run switch-db mysql

# Prefer the simplicity of Firebase?
npm run switch-db firebase
```

### 3. **Configure Your Environment**
Copy `.env.example` to `.env` and unleash the power:

```env
# 🎛️ The Master Switch - Choose Your Database Destiny
USE_FIREBASE=false

# 🔧 MySQL Configuration (When you need that SQL power)
MYSQL_HOST=localhost
MYSQL_USER=your_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=your_database

# 🔥 Firebase Configuration (When you want Google's magic)
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id

# 🌐 WebSocket Magic (Real-time data streaming)
WS_PORT=8080
WS_AUTH_ENABLED=false

# 🔌 Serial Communication (Talk to your hardware)
SERIAL_PORT=COM3          # Windows
# SERIAL_PORT=/dev/ttyUSB0  # Linux
SERIAL_BAUDRATE=9600
```

### 4. **Launch Your Monitoring Empire**
```bash
npm start
```

## 🎮 Features That'll Make You Smile

### 🗄️ **Database Layer - The Foundation of Dreams**

**Dual Database Support** - Because choice is beautiful:

```javascript
// Same code, different databases! 
const users = await db.table('users')
    .where('status', 'active')
    .where('last_login', '>', '2024-01-01')
    .orderBy('created_at', 'desc')
    .limit(10)
    .get();

// Works with both MySQL AND Firebase! 🎉
```

**Query Builder That Speaks Your Language:**
```javascript
// Simple and intuitive
const activeUsers = await db.table('users')
    .where({ status: 'active', role: 'admin' })
    .whereIn('department', ['IT', 'Engineering'])
    .whereBetween('salary', 50000, 100000)
    .orderByDesc('last_login')
    .get();

// Complex joins? No problem!
const userData = await db.table('users')
    .leftJoin('profiles', 'users.id', 'profiles.user_id')
    .select(['users.name', 'profiles.avatar'])
    .where('users.active', true)
    .get();
```

### 🔌 **Serial Communication - Your Hardware Whisperer**

**Smart Auto-Detection:**
- 🔍 Automatically finds Arduino/ESP32 devices
- 🔄 Self-healing connections that bounce back from failures
- 🎯 Dynamic port switching when better connections are found
- 📡 Real-time status updates to your interface

```javascript
// Your serial manager is like a reliable friend
const serialManager = new SerialManager(database, mainWindow);
await serialManager.initialize(); // Handles everything for you!

// Check status anytime
const status = serialManager.getStatus();
await serialManager.forceReconnect();
```

**Data Handling Made Simple:**
```javascript
// Supports multiple data types
// JSON Object: {"temperature": 25.5, "humidity": 60}
// JSON Array: [25.5, 60, 1023]
// CSV: "25.5,60,1023"
// Raw: "TEMP:25.5,HUM:60"
```

### 🌐 **WebSocket Server - Real-time Magic**

**Broadcasting That Just Works:**
```javascript
const wsHandler = new WebSocketHandler({
    port: 8080,
    enableAuthentication: false,
    maxConnections: 50
}, db, mainWindow);

// Broadcast to all connected clients
wsHandler.broadcastToAll({
    type: 'sensor_update',
    data: { temperature: 25.5, timestamp: new Date() }
});
```

## 🎛️ **Configuration - Tailor It to Your Needs**

### Database Switching Made Effortless
```bash
# Switch to MySQL
npm run switch-db mysql

# Switch to Firebase  
npm run switch-db firebase

# Check current database
npm run check-db
```

### Environment Variables - Your Control Panel
```env
# 🎯 Core Settings
USE_FIREBASE=false                    # The big switch
API_PORT=3001                        # Your API lives here

# 🔌 Serial Communication
SERIAL_PORT=null                     # Auto-detect magic
SERIAL_BAUDRATE=9600                 # Standard baud rate
SERIAL_DATA_TYPES=json-object        # How your device talks
SERIAL_DB_TABLE_NAME=sensors         # Where data lands

# 🌐 WebSocket Configuration
WS_PORT=8080                         # Real-time data port
WS_AUTH_ENABLED=false               # Keep it simple
WS_MAX_CONNECTIONS=10               # Control the crowd
WS_HEARTBEAT_INTERVAL=30000         # Keep connections alive

# 🔐 Security
DB_ENCRYPTION_KEY=YourSecretKey     # Lock it down
```

## 🎨 **Frontend Integration - Seamless Connection**

Your frontend gets superpowers through the preload bridge:

```javascript
// In your renderer process
const api = window.api;

// Database operations
const sensors = await api.getDataByFilters('sensors', 
    { active: true }, 
    { orderBy: 'timestamp DESC', limit: 100 }
);

// Serial communication
const status = await api.getSerialStatus();
await api.forceReconnect();
await api.sendData('RESET_SENSORS');

// Real-time data listening
api.receive('serial-data-received', (data) => {
    console.log('New sensor data:', data);
    updateDashboard(data);
});

api.receive('database-insert-success', (result) => {
    console.log('Data saved:', result);
    showNotification('Data saved successfully!');
});
```

## 🏁 **Real-World Example - Putting It All Together**

Let's build a temperature monitoring system with the new modular approach:

```javascript
// 1. In main.js - Clean initialization
class Application {
    async initialize() {
        // Clean, organized setup
        this.databaseManager = new DatabaseManager();
        await this.databaseManager.initialize();
        
        this.serialManager = new SerialManager(
            this.databaseManager.getDatabase(), 
            this.windowManager.getMainWindow()
        );
        await this.serialManager.initialize();
        
        // Everything is organized and easy to follow!
    }
}

// 2. Your modules handle the complexity
// serialManager automatically:
// - Connects to your Arduino temperature sensor
// - Validates incoming data
// - Encrypts sensitive location data
// - Saves to your chosen database
// - Broadcasts to WebSocket clients
// - Updates your Electron interface

// 3. Your Arduino sends: {"temperature": 25.5, "humidity": 60, "location": "Lab1"}
// Framework handles everything automatically!
```

## 🎯 **Common Development Scenarios**

### 🔌 **Adding a New Serial Device Type**
```javascript
// 1. Edit modules/serial/serialManager.js
class SerialManager {
    getSerialConfig() {
        return {
            // Add your device configuration
            deviceTypes: ['arduino', 'esp32', 'your-new-device'],
            // ...
        };
    }
}

// 2. The existing lib/com/serialCommunicator.js handles the rest!
```

### 📊 **Adding a New API Endpoint**
```javascript
// 1. Edit modules/api/apiServer.js
class APIServer {
    setupRoutes() {
        // Add your new endpoint
        this.app.get('/api/sensors/status', async (req, res) => {
            const status = await this.database.table('sensors')
                .where('active', true)
                .get();
            res.json({ success: true, data: status });
        });
    }
}
```

### 🗄️ **Adding a New Database Operation**
```javascript
// 1. Edit modules/ipc/ipcManager.js
class IPCManager {
    setupDatabaseHandlers() {
        ipcMain.handle('get-sensor-summary', async () => {
            try {
                const summary = await this.database.table('sensors')
                    .select(['COUNT(*) as total', 'AVG(temperature) as avg_temp'])
                    .first();
                return { success: true, data: summary };
            } catch (err) {
                return { success: false, error: err.message };
            }
        });
    }
}

// 2. Frontend can now call: api.getSensorSummary()
```

## 🔧 **Advanced Features - For the Power Users**

### Custom Module Creation
```javascript
// Create your own module: modules/analytics/analyticsManager.js
class AnalyticsManager {
    constructor(database) {
        this.database = database;
    }
    
    async initialize() {
        // Setup analytics processing
        console.log('Analytics manager initialized');
    }
    
    async generateReport(dateRange) {
        // Custom analytics logic
        return await this.database.table('sensors')
            .whereBetween('timestamp', dateRange)
            .get();
    }
}

// Add to main.js:
this.analyticsManager = new AnalyticsManager(this.databaseManager.getDatabase());
```

### Module Communication
```javascript
// Modules can communicate through the main application
class Application {
    async initialize() {
        this.databaseManager = new DatabaseManager();
        this.serialManager = new SerialManager(/* ... */);
        
        // Connect modules
        this.serialManager.on('data-received', (data) => {
            this.analyticsManager.processRealTimeData(data);
        });
    }
}
```

## 🐛 **Troubleshooting - We've Got Your Back**

### Module-Specific Debugging

**Database Module Issues?**
```javascript
// Check databaseManager status
const dbManager = new DatabaseManager();
await dbManager.initialize();
console.log('Database ready:', dbManager.isFirebase() ? 'Firebase' : 'MySQL');
```

**Serial Module Not Working?**
```javascript
// Debug serial manager
const status = serialManager.getStatus();
console.log('Serial status:', status);
await serialManager.forceReconnect();
```

**API Module Problems?**
```javascript
// Check API server
const apiServer = new APIServer(database);
apiServer.start();
console.log(`API running on port: ${apiServer.getPort()}`);
```

## 🚀 **Migration from Old Structure**

### Easy Migration Steps
1. **Create the modules folder structure**
2. **Copy the module files** from the artifacts
3. **Replace your main.js** with the new clean version
4. **Update any custom code** to use the new module imports
5. **Test each module** individually

### Before & After Comparison
```javascript
// OLD: Everything in main.js (300+ lines)
const db = useFirebase ? new FirebaseDB(config) : new Database(config);
const serialCommunicator = new SerialCommunicator(config, db, mainWindow);
// ... 250+ more lines of mixed concerns

// NEW: Clean and organized (60 lines)
class Application {
    async initialize() {
        this.databaseManager = new DatabaseManager();
        this.serialManager = new SerialManager();
        // Clean, focused, maintainable!
    }
}
```

## 📌 TODO / Future Improvements
- [ ] ✅ **COMPLETED**: Modular Architecture Implementation
- [ ] Making Compact Frontend Components with Module Support
- [ ] Frontend With WebSocket Support and Module Integration
- [ ] Asset for Monitoring System
- [ ] Revising Auth for better and compact module-based use
- [ ] Module-based Plugin System
- [ ] Hot Module Reloading for Development

## 🎯 **Best Practices for Modular Development**

### 1. **Module Responsibility**
```javascript
// ✅ GOOD: Single responsibility
class DatabaseManager {
    // Only handles database concerns
}

// ❌ BAD: Mixed responsibilities  
class DatabaseAndSerialManager {
    // Handles both database AND serial - too much!
}
```

### 2. **Clean Module Interfaces**
```javascript
// ✅ GOOD: Clear, simple interface
class SerialManager {
    async initialize() { /* ... */ }
    getStatus() { /* ... */ }
    async close() { /* ... */ }
}

// ❌ BAD: Exposing internal complexity
class SerialManager {
    serialCommunicator = null;
    internalBuffer = [];
    _handleRawData() { /* internal method exposed */ }
}
```

### 3. **Error Handling**
```javascript
// ✅ GOOD: Module-level error handling
class DatabaseManager {
    async initialize() {
        try {
            await this.db.connect();
            console.log('Database initialized');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error; // Let application handle
        }
    }
}
```

## 🤝 **Contributing - Join the Journey**

We love contributions! The new modular structure makes contributing even easier:

- 🧩 **Add New Modules**: Create focused, single-purpose modules
- 🐛 **Fix Module Issues**: Debug specific modules in isolation  
- ✨ **Enhance Existing Modules**: Improve without affecting others
- 📖 **Document Modules**: Help others understand the structure
- 🧪 **Test Modules**: Create unit tests for individual modules

Check out our [Contributing Guide](CONTRIBUTING.md) to get started!

## 📄 **License**

This project isn't being Licensed and still be use as open source project, but be sure to tag the user account of any pulling or developing this code

---

## 💡 **Ready to Build Something Amazing?**

This framework isn't just code - it's your foundation for creating monitoring systems that actually work in the real world. With the new **modular architecture**, you get:

- **🚀 Faster Development**: Know exactly where to make changes
- **🔧 Easier Maintenance**: Update one module without breaking others  
- **📈 Better Scalability**: Add features without refactoring everything
- **🎯 Cleaner Code**: Each module has a single, clear purpose
- **🧪 Better Testing**: Test modules independently

Whether you're monitoring industrial equipment, environmental sensors, or IoT devices, we've built the tools you need to succeed - now with a structure that grows with your project!

**Start your monitoring adventure today!**

```bash
git clone <your-repo>
cd flow-meter-monitoring
npm install
npm start
```

### 🌟 **Star us on GitHub if this modular framework helps you build something awesome!**

---

*Built with ❤️ for developers who believe monitoring should be powerful, flexible, maintainable, and actually enjoyable to work with.*
